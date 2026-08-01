import os
import numpy as np
import pickle
import logging
from flask import Flask, request, render_template

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, template_folder="template", static_folder="staticfiles")

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "build.pkl")

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


def validate_inputs(form_data: dict) -> tuple[list | None, str | None]:
    try:
        features = []
        for field in FORM_ORDER:
            value = form_data.get(field)
            if value is None or value == "":
                return None, f"Missing required field: {field}"
            features.append(int(value))
        return features, None
    except (ValueError, TypeError) as e:
        return None, f"Invalid input: {e}"


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return render_template("index.html", prediction_text="Model not loaded. Please try again later."), 500

    features, error = validate_inputs(request.form)
    if error:
        return render_template("index.html", prediction_text=error), 400

    try:
        prediction = model.predict([np.array(features)])[0]
        result = "Loan is Approved" if prediction == 1 else "Loan is Rejected"
        return render_template("index.html", prediction_text=result)
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return render_template("index.html", prediction_text="Prediction failed. Please try again."), 500


@app.route("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 9000)))
