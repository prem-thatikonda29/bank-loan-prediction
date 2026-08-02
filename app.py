import os
import numpy as np
import pickle
import logging
import pandas as pd
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, template_folder="template", static_folder="staticfiles")
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:3000",
    r"https://.*\.vercel\.app",
    "https://bank-loan-prediction-beta.vercel.app",
]}})

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "build_v2.pkl")
CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Bank_Loan.csv")

try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    model = None

NUMERIC_FIELDS = ["Age", "Dependents", "ApplicantIncome", "LoanAmount", "Cibil_Score", "Tenure"]
CATEGORICAL_FIELDS = ["Gender", "Married", "Education", "Self_Employed", "Previous_Loan_Taken", "Property_Area", "Customer_Bandwith"]
FORM_ORDER = NUMERIC_FIELDS + CATEGORICAL_FIELDS

FEATURE_LABELS = {
    "Age": "Age",
    "Dependents": "Number of Dependents",
    "ApplicantIncome": "Annual Income",
    "LoanAmount": "Loan Amount",
    "Cibil_Score": "CIBIL Score",
    "Tenure": "Loan Tenure",
    "Gender": "Gender",
    "Married": "Marital Status",
    "Education": "Education Level",
    "Self_Employed": "Employment Type",
    "Previous_Loan_Taken": "Previous Loan History",
    "Property_Area": "Property Location",
    "Customer_Bandwith": "Banking Relationship",
}

LABEL_MAPPINGS = {
    "Gender": {0: "Female", 1: "Male"},
    "Married": {0: "Single", 1: "Married"},
    "Education": {0: "Not Graduate", 1: "Graduate"},
    "Self_Employed": {0: "Salaried", 1: "Self-employed"},
    "Previous_Loan_Taken": {0: "No previous loan", 1: "Yes, previously taken"},
    "Property_Area": {0: "Rural area", 1: "Semi-urban area", 2: "Urban area"},
    "Customer_Bandwith": {0: "Poor", 1: "Good", 2: "Average"},
}

FEATURE_IMPORTANCE = {}


def compute_thresholds(csv_path: str) -> dict:
    """Compute typical approved values from training data."""
    try:
        df = pd.read_csv(csv_path)
        approved = df[df["Loan_Status"] == "Yes"]
        thresholds = {}
        for col in NUMERIC_FIELDS:
            thresholds[col] = {
                "median": float(approved[col].median()),
                "q25": float(approved[col].quantile(0.25)),
                "q75": float(approved[col].quantile(0.75)),
            }
        for col in CATEGORICAL_FIELDS:
            thresholds[col] = {
                "mode": approved[col].mode()[0] if len(approved[col].mode()) > 0 else None
            }
        logger.info("Thresholds computed from training data")
        return thresholds
    except Exception as e:
        logger.error(f"Failed to compute thresholds: {e}")
        return {}


APPROVED_THRESHOLDS = compute_thresholds(CSV_PATH)


def get_db_connection():
    """Get a database connection with SSL for Neon."""
    import psycopg2
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        return None
    if "sslmode" not in db_url:
        db_url += ("&" if "?" in db_url else "?") + "sslmode=require"
    return psycopg2.connect(db_url)


def build_model_features(inputs: dict) -> list:
    """Convert form inputs to the 16-feature vector the model expects."""
    age = int(inputs["Age"])
    dependents = int(inputs["Dependents"])
    income = int(inputs["ApplicantIncome"])
    loan = int(inputs["LoanAmount"])
    cibil = int(inputs["Cibil_Score"])
    tenure = int(inputs["Tenure"])
    gender = int(inputs["Gender"])
    married = int(inputs["Married"])
    education = int(inputs["Education"])
    self_emp = int(inputs["Self_Employed"])
    prev_loan = int(inputs["Previous_Loan_Taken"])
    prop_area = int(inputs["Property_Area"])
    bandwidth = int(inputs["Customer_Bandwith"])

    income_loan_ratio = income / loan if loan > 0 else 0
    loan_burden = loan / tenure if tenure > 0 else 0
    income_per_dep = income / (dependents + 1)

    # Must match the order used during training:
    # Age, Gender, Married, Dependents, Education, Self_Employed,
    # ApplicantIncome, LoanAmount, Previous_Loan_Taken, Cibil_Score,
    # Property_Area, Customer_Bandwith, Tenure, Income_Loan_Ratio,
    # Loan_Burden, Income_Per_Dependent
    return [
        age, gender, married, dependents, education, self_emp,
        income, loan, prev_loan, cibil, prop_area, bandwidth, tenure,
        income_loan_ratio, loan_burden, income_per_dep,
    ]


def compute_rejection_reasons(inputs: dict) -> list:
    """Compare user inputs against typical approved values."""
    reasons = []
    feature_map = {
        "Age": "Age", "Dependents": "Dependents",
        "ApplicantIncome": "ApplicantIncome", "LoanAmount": "LoanAmount",
        "Cibil_Score": "Cibil_Score", "Tenure": "Tenure",
        "Gender": "Gender", "Married": "Married", "Education": "Education",
        "Self_Employed": "Self_Employed", "Previous_Loan_Taken": "Previous_Loan_Taken",
        "Property_Area": "Property_Area", "Customer_Bandwith": "Customer_Bandwith",
    }

    for form_field, csv_col in feature_map.items():
        if csv_col not in APPROVED_THRESHOLDS:
            continue
        user_val = inputs.get(form_field)
        if user_val is None:
            continue

        thresholds = APPROVED_THRESHOLDS[csv_col]
        importance = FEATURE_IMPORTANCE.get(form_field, 0)

        if csv_col in NUMERIC_FIELDS and "q25" in thresholds:
            if user_val < thresholds["q25"]:
                reasons.append({
                    "feature": form_field,
                    "label": FEATURE_LABELS[form_field],
                    "user_value": user_val,
                    "typical_approved": int(thresholds["q25"]),
                    "explanation": f"Your {FEATURE_LABELS[form_field]} ({user_val}) is below the typical approval range ({int(thresholds['q25'])}+)"
                })
            elif csv_col == "LoanAmount" and "q75" in thresholds and user_val > thresholds["q75"]:
                reasons.append({
                    "feature": form_field,
                    "label": FEATURE_LABELS[form_field],
                    "user_value": user_val,
                    "typical_approved": int(thresholds["q75"]),
                    "explanation": f"Your {FEATURE_LABELS[form_field]} ({user_val}) is higher than typical approved loans (under {int(thresholds['q75'])})"
                })
        elif csv_col in CATEGORICAL_FIELDS and "mode" in thresholds and thresholds["mode"] is not None:
            if str(user_val) != str(thresholds["mode"]) and importance > 0.05:
                user_label = LABEL_MAPPINGS.get(csv_col, {}).get(user_val, str(user_val))
                typical_label = LABEL_MAPPINGS.get(csv_col, {}).get(thresholds["mode"], str(thresholds["mode"]))
                reasons.append({
                    "feature": form_field,
                    "label": FEATURE_LABELS[form_field],
                    "user_value": user_val,
                    "typical_approved": thresholds["mode"],
                    "explanation": f"Most approved loans have {FEATURE_LABELS[form_field]} = {typical_label}, yours is {user_label}"
                })

    reasons.sort(key=lambda x: FEATURE_IMPORTANCE.get(x["feature"], 0), reverse=True)
    return reasons[:3]


def compute_feature_importance():
    """Extract feature importances from the model."""
    global FEATURE_IMPORTANCE
    if model is not None and hasattr(model, 'feature_importances_'):
        # Map the 16 model features back to form field names
        model_fields = [
            "Age", "Gender", "Married", "Dependents", "Education", "Self_Employed",
            "ApplicantIncome", "LoanAmount", "Previous_Loan_Taken", "Cibil_Score",
            "Property_Area", "Customer_Bandwith", "Tenure", "Income_Loan_Ratio",
            "Loan_Burden", "Income_Per_Dependent",
        ]
        for i, field in enumerate(model_fields):
            if i < len(model.feature_importances_):
                FEATURE_IMPORTANCE[field] = float(model.feature_importances_[i])
        logger.info(f"Feature importances: {FEATURE_IMPORTANCE}")


compute_feature_importance()


def validate_inputs(form_data: dict) -> tuple:
    """Validate and parse form inputs."""
    try:
        for field in FORM_ORDER:
            value = form_data.get(field)
            if value is None or value == "":
                return None, f"Missing required field: {field}"
            int(value)
        return True, None
    except (ValueError, TypeError) as e:
        return None, f"Invalid input: {e}"


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    """Legacy HTML form endpoint."""
    if model is None:
        return render_template("index.html", prediction_text="Model not loaded."), 500

    features, error = validate_inputs(request.form)
    if error:
        return render_template("index.html", prediction_text=error), 400

    try:
        model_features = build_model_features(request.form)
        prediction = model.predict([np.array(model_features)])[0]
        result = "Loan is Approved" if prediction == 1 else "Loan is Rejected"
        return render_template("index.html", prediction_text=result)
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return render_template("index.html", prediction_text="Prediction failed."), 500


def save_prediction(result: str):
    """Save prediction result to database."""
    try:
        conn = get_db_connection()
        if not conn:
            return
        cur = conn.cursor()
        cur.execute("INSERT INTO predictions (result) VALUES (%s)", (result,))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to save prediction: {e}")


@app.route("/api/predict", methods=["POST"])
def api_predict():
    """JSON API endpoint for predictions."""
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    features, error = validate_inputs(data)
    if error:
        return jsonify({"error": error}), 400

    try:
        model_features = build_model_features(data)
        prediction = model.predict([np.array(model_features)])[0]
        result = "approved" if prediction == 1 else "rejected"

        save_prediction(result)

        response = {
            "prediction": int(prediction),
            "result": result,
            "message": f"Loan is {'Approved' if prediction == 1 else 'Rejected'}",
        }

        if prediction == 0:
            response["rejection_reasons"] = compute_rejection_reasons(data)

        return jsonify(response)
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({"error": "Prediction failed"}), 500


@app.route("/api/stats")
def api_stats():
    """Return prediction statistics from database."""
    conn = get_db_connection()
    if not conn:
        logger.warning("DATABASE_URL not set, stats unavailable")
        return jsonify({"total": 0, "approved": 0, "rejected": 0, "approval_rate": 0, "available": False})

    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT COUNT(*), SUM(CASE WHEN result='approved' THEN 1 ELSE 0 END)
            FROM predictions
        """)
        total, approved = cur.fetchone()
        cur.close()
        conn.close()

        total = total or 0
        approved = approved or 0
        rejected = total - approved
        approval_rate = round((approved / total * 100), 1) if total > 0 else 0

        return jsonify({
            "total": total,
            "approved": approved,
            "rejected": rejected,
            "approval_rate": approval_rate,
            "available": True,
        })
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return jsonify({"total": 0, "approved": 0, "rejected": 0, "approval_rate": 0, "available": False})


@app.route("/health")
def health():
    return jsonify({"status": "healthy", "model_loaded": model is not None})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 9000)))
