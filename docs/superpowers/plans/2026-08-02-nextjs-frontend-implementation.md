# Bank Loan Prediction — Full Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the ML model, add JSON API endpoints, and build a modern Next.js frontend for the bank loan prediction app.

**Architecture:** Phase 0 improves the model (feature engineering, class weights, better algorithm, cross-validation). Phase 1 adds Flask API endpoints with CORS and Neon DB. Phase 2 builds a Next.js 16 SPA with multi-step form, rejection reasons, and feature importance display.

**Tech Stack:** Python 3.12, Flask 3.1.3, scikit-learn, XGBoost, Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, motion/react, Neon DB (PostgreSQL)

## Global Constraints

- Python 3.12
- Flask 3.1.3
- scikit-learn 1.9.0
- Next.js 16.x (latest)
- React 19.x
- Tailwind CSS 4.x
- shadcn/ui latest
- Light theme with blue pastel palette
- Mobile responsive
- Model file: `build_v2.pkl` (improved model)
- Database: Neon DB (PostgreSQL, free tier)
- Frontend deploy: Vercel
- Backend deploy: Render (existing service)

---

## Phase 0: Model Improvements

### Task 0.1: Create Model Improvement Notebook

**Files:**
- Create: `BankLoanPredictionV2.ipynb`

**Interfaces:**
- Consumes: `Bank_Loan.csv`
- Produces: `build_v2.pkl`

- [ ] **Step 1: Create notebook with data loading and exploration**

```python
# Cell 1: Imports
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from xgboost import XGBClassifier
import pickle

# Cell 2: Load data
df = pd.read_csv('Bank_Loan.csv')
print(f"Shape: {df.shape}")
print(f"\nClass distribution:")
print(df['Loan_Status'].value_counts())
print(f"\nClass ratio: {df['Loan_Status'].value_counts().values[0] / df['Loan_Status'].value_counts().values[1]:.2f}:1")
```

- [ ] **Step 2: Run to see current class imbalance**

Run: `jupyter nbconvert --to notebook --execute BankLoanPredictionV2.ipynb`
Expected: Output shows ~72% "No" (rejected), ~28% "Yes" (approved), ratio ~2.65:1

- [ ] **Step 3: Add feature engineering cells**

```python
# Cell 3: Feature Engineering
df['Income_Loan_Ratio'] = df['ApplicantIncome'] / df['LoanAmount']
df['Loan_Burden'] = df['LoanAmount'] / df['Tenure']
df['Income_Per_Dependent'] = df['ApplicantIncome'] / (df['Dependents'] + 1)

# Cell 4: Drop Loan_ID
df = df.drop(['Loan_ID'], axis=1)

# Cell 5: Encode categoricals
le = LabelEncoder()
categorical_cols = ['Gender', 'Married', 'Education', 'Self_Employed', 
                    'Previous_Loan_Taken', 'Property_Area', 'Customer_Bandwith', 'Loan_Status']
for col in categorical_cols:
    df[col] = le.fit_transform(df[col])

# Cell 6: Split features and target
X = df.drop('Loan_Status', axis=1)
y = df['Loan_Status']
feature_names = X.columns.tolist()
print(f"Features ({len(feature_names)}): {feature_names}")
```

- [ ] **Step 4: Add model comparison cells**

```python
# Cell 7: Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Cell 8: Model comparison with class_weight='balanced'
models = {
    'Decision Tree (original)': DecisionTreeClassifier(criterion='gini', min_samples_split=300, min_samples_leaf=50, max_depth=4),
    'Decision Tree (balanced)': DecisionTreeClassifier(criterion='gini', min_samples_split=300, min_samples_leaf=50, max_depth=4, class_weight='balanced'),
    'Random Forest (balanced)': RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced'),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
    'XGBoost (balanced)': XGBClassifier(n_estimators=100, random_state=42, scale_pos_weight=2.65, eval_metric='logloss'),
}

results = {}
for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    report = classification_report(y_test, y_pred, output_dict=True)
    results[name] = {
        'accuracy': report['accuracy'],
        'f1_approved': report['1']['f1-score'],
        'recall_approved': report['1']['recall'],
        'precision_approved': report['1']['precision'],
    }
    print(f"\n{'='*60}")
    print(f"{name}")
    print(f"{'='*60}")
    print(classification_report(y_test, y_pred))

# Cell 9: Compare results
results_df = pd.DataFrame(results).T
print("\nModel Comparison:")
print(results_df.to_string())
```

- [ ] **Step 5: Run comparison and select best model**

Run: `jupyter nbconvert --to notebook --execute BankLoanPredictionV2.ipynb`
Expected: Table comparing 5 models. Look for highest recall_approved and f1_approved.

- [ ] **Step 6: Add cross-validation and final model training**

```python
# Cell 10: Cross-validate the best model (adjust based on results)
best_model_name = results_df['f1_approved'].idxmax()
print(f"Best model: {best_model_name}")

# Cell 11: Final model with cross-validation
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

if 'XGBoost' in best_model_name:
    final_model = XGBClassifier(n_estimators=100, random_state=42, scale_pos_weight=2.65, eval_metric='logloss')
elif 'Random Forest' in best_model_name:
    final_model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
elif 'Gradient Boosting' in best_model_name:
    final_model = GradientBoostingClassifier(n_estimators=100, random_state=42)
else:
    final_model = DecisionTreeClassifier(criterion='gini', min_samples_split=300, min_samples_leaf=50, max_depth=4, class_weight='balanced')

cv_scores = cross_val_score(final_model, X, y, cv=cv, scoring='f1')
print(f"\n5-Fold CV F1 scores: {cv_scores}")
print(f"Mean F1: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

# Cell 12: Train final model on full data
final_model.fit(X, y)
y_pred = final_model.predict(X_test)
print("\nFinal Model Test Results:")
print(classification_report(y_test, y_pred))
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# Cell 13: Feature importances
if hasattr(final_model, 'feature_importances_'):
    importances = pd.Series(final_model.feature_importances_, index=feature_names)
    importances = importances.sort_values(ascending=False)
    print("\nFeature Importances:")
    for feat, imp in importances.items():
        print(f"  {feat}: {imp:.4f}")

# Cell 14: Save model
with open('build_v2.pkl', 'wb') as f:
    pickle.dump(final_model, f)
print("\nModel saved to build_v2.pkl")
print(f"Features expected: {feature_names}")
```

- [ ] **Step 7: Execute notebook and verify model saves**

Run: `jupyter nbconvert --to notebook --execute BankLoanPredictionV2.ipynb`
Expected: `build_v2.pkl` created, classification report shows improved recall for approved class

- [ ] **Step 8: Commit**

```bash
git add BankLoanPredictionV2.ipynb build_v2.pkl
git commit -m "feat: add improved model with feature engineering and class weights"
```

---

## Phase 1: Backend Updates

### Task 1.1: Update requirements.txt

**Files:**
- Modify: `requirements.txt`

**Interfaces:**
- Consumes: existing packages
- Produces: updated requirements with new dependencies

- [ ] **Step 1: Update requirements.txt**

```
flask==3.1.3
gunicorn==23.0.0
numpy==2.5.1
pandas==3.0.5
scikit-learn==1.9.0
xgboost==3.0.0
flask-cors==5.0.1
psycopg2-binary==2.9.10
```

- [ ] **Step 2: Install new dependencies**

Run: `pip install -r requirements.txt`
Expected: Installs without errors

- [ ] **Step 3: Commit**

```bash
git add requirements.txt
git commit -m "chore: add flask-cors, psycopg2-binary, xgboost to requirements"
```

### Task 1.2: Refactor app.py with JSON API Endpoints

**Files:**
- Modify: `app.py`

**Interfaces:**
- Consumes: `build_v2.pkl`, `Bank_Loan.csv`
- Produces: `/api/predict` (POST, JSON in/out), `/api/stats` (GET, JSON), rejection reasons

- [ ] **Step 1: Rewrite app.py with new endpoints**

```python
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
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "https://*.vercel.app"]}})

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
    "Dependents": "Dependents",
    "ApplicantIncome": "Income",
    "LoanAmount": "Loan Amount",
    "Cibil_Score": "CIBIL Score",
    "Tenure": "Tenure",
    "Gender": "Gender",
    "Married": "Marital Status",
    "Education": "Education",
    "Self_Employed": "Employment Type",
    "Previous_Loan_Taken": "Previous Loan",
    "Property_Area": "Property Area",
    "Customer_Bandwith": "Banking History",
}

LABEL_MAPPINGS = {
    "Gender": {0: "Female", 1: "Male"},
    "Married": {0: "No", 1: "Yes"},
    "Education": {0: "No", 1: "Yes"},
    "Self_Employed": {0: "No", 1: "Yes"},
    "Previous_Loan_Taken": {0: "No", 1: "Yes"},
    "Property_Area": {0: "Rural", 1: "Semiurban", 2: "Urban"},
    "Customer_Bandwith": {0: "Bad", 1: "Good", 2: "Medium"},
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

def compute_rejection_reasons(inputs: dict) -> list:
    """Compare user inputs against typical approved values."""
    reasons = []
    
    # Map form field names to CSV column names for comparison
    feature_map = {
        "Age": "Age",
        "Dependents": "Dependents",
        "ApplicantIncome": "ApplicantIncome",
        "LoanAmount": "LoanAmount",
        "Cibil_Score": "Cibil_Score",
        "Tenure": "Tenure",
        "Gender": "Gender",
        "Married": "Married",
        "Education": "Education",
        "Self_Employed": "Self_Employed",
        "Previous_Loan_Taken": "Previous_Loan_Taken",
        "Property_Area": "Property_Area",
        "Customer_Bandwith": "Customer_Bandwith",
    }
    
    for form_field, csv_col in feature_map.items():
        if csv_col not in APPROVED_THRESHOLDS:
            continue
            
        user_val = inputs.get(form_field)
        if user_val is None:
            continue
        
        thresholds = APPROVED_THRESHOLDS[csv_col]
        importance = FEATURE_IMPORTANCE.get(form_field, 0)
        
        # For numeric features: check if below 25th percentile
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
        
        # For categorical features: check if differs from mode
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
    
    # Sort by importance (highest first)
    reasons.sort(key=lambda x: FEATURE_IMPORTANCE.get(x["feature"], 0), reverse=True)
    return reasons[:3]


def compute_feature_importance():
    """Extract feature importances from the model."""
    global FEATURE_IMPORTANCE
    if model is not None and hasattr(model, 'feature_importances_'):
        for i, field in enumerate(FEATURE_ORDER):
            if i < len(model.feature_importances_):
                FEATURE_IMPORTANCE[field] = float(model.feature_importances_[i])
        logger.info(f"Feature importances: {FEATURE_IMPORTANCE}")

FEATURE_ORDER = NUMERIC_FIELDS + CATEGORICAL_FIELDS

compute_feature_importance()


def validate_inputs(form_data: dict) -> tuple:
    """Validate and parse form inputs."""
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
    """Legacy HTML form endpoint."""
    if model is None:
        return render_template("index.html", prediction_text="Model not loaded."), 500

    features, error = validate_inputs(request.form)
    if error:
        return render_template("index.html", prediction_text=error), 400

    try:
        prediction = model.predict([np.array(features)])[0]
        result = "Loan is Approved" if prediction == 1 else "Loan is Rejected"
        return render_template("index.html", prediction_text=result)
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return render_template("index.html", prediction_text="Prediction failed."), 500


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
        prediction = model.predict([np.array(features)])[0]
        result = "approved" if prediction == 1 else "rejected"
        
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
    try:
        import psycopg2
        conn = psycopg2.connect(os.environ.get("DATABASE_URL"))
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*), SUM(CASE WHEN result='approved' THEN 1 ELSE 0 END) FROM predictions")
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
        })
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return jsonify({"total": 0, "approved": 0, "rejected": 0, "approval_rate": 0})


@app.route("/health")
def health():
    return jsonify({"status": "healthy", "model_loaded": model is not None})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 9000)))
```

- [ ] **Step 2: Test the API endpoints locally**

Run: `python app.py`

Test health:
```bash
curl http://localhost:9000/health
```
Expected: `{"model_loaded":true,"status":"healthy"}`

Test prediction:
```bash
curl -X POST http://localhost:9000/api/predict -H "Content-Type: application/json" -d '{"Age":35,"Dependents":2,"ApplicantIncome":50000,"LoanAmount":200000,"Cibil_Score":750,"Tenure":60,"Gender":1,"Married":1,"Education":1,"Self_Employed":0,"Previous_Loan_Taken":0,"Property_Area":2,"Customer_Bandwith":1}'
```
Expected: JSON with prediction result

Test rejection reasons:
```bash
curl -X POST http://localhost:9000/api/predict -H "Content-Type: application/json" -d '{"Age":25,"Dependents":0,"ApplicantIncome":20000,"LoanAmount":500000,"Cibil_Score":500,"Tenure":12,"Gender":0,"Married":0,"Education":0,"Self_Employed":1,"Previous_Loan_Taken":0,"Property_Area":0,"Customer_Bandwith":0}'
```
Expected: JSON with rejection_reasons array

- [ ] **Step 3: Commit**

```bash
git add app.py
git commit -m "feat: add JSON API endpoints with rejection reasons and CORS"
```

---

## Phase 2: Frontend (Next.js)

### Task 2.1: Initialize Next.js Project

**Files:**
- Create: `frontend/` directory with Next.js app

**Interfaces:**
- Consumes: nothing
- Produces: Next.js project scaffold

- [ ] **Step 1: Create Next.js app**

```bash
cd /Users/premthatikonda/Downloads/cloud
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Select defaults: TypeScript Yes, Tailwind Yes, ESLint Yes, App Router Yes, src/ No, import alias @/*

- [ ] **Step 2: Install additional dependencies**

```bash
cd frontend
npm install motion @phosphor-icons/react class-variance-authority clsx tailwind-merge
npx shadcn@latest init
npx shadcn@latest add button input select card label
```

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```
Expected: App runs at http://localhost:3000

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: initialize Next.js 16 project with shadcn/ui and Tailwind"
```

### Task 2.2: Create API Client and Types

**Files:**
- Create: `frontend/lib/api.ts`

**Interfaces:**
- Consumes: Flask backend at `NEXT_PUBLIC_API_URL`
- Produces: `predict(data)`, `getStats()` functions

- [ ] **Step 1: Create API client**

```typescript
// frontend/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export interface PredictionInput {
  Age: number;
  Dependents: number;
  ApplicantIncome: number;
  LoanAmount: number;
  Cibil_Score: number;
  Tenure: number;
  Gender: number;
  Married: number;
  Education: number;
  Self_Employed: number;
  Previous_Loan_Taken: number;
  Property_Area: number;
  Customer_Bandwith: number;
}

export interface RejectionReason {
  feature: string;
  label: string;
  user_value: number;
  typical_approved: number;
  explanation: string;
}

export interface PredictionResponse {
  prediction: number;
  result: "approved" | "rejected";
  message: string;
  rejection_reasons?: RejectionReason[];
}

export interface StatsResponse {
  total: number;
  approved: number;
  rejected: number;
  approval_rate: number;
}

export async function predict(data: PredictionInput): Promise<PredictionResponse> {
  const res = await fetch(`${API_URL}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
}

export async function getStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_URL}/api/stats`);
  if (!res.ok) return { total: 0, approved: 0, rejected: 0, approval_rate: 0 };
  return res.json();
}
```

- [ ] **Step 2: Create .env.local**

```
NEXT_PUBLIC_API_URL=http://localhost:9000
```

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/api.ts frontend/.env.local
git commit -m "feat: add API client for Flask backend"
```

### Task 2.3: Build Hero Component

**Files:**
- Create: `frontend/components/Hero.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: Hero section with headline, subtext, CTA

- [ ] **Step 1: Create Hero component**

```tsx
// frontend/components/Hero.tsx
"use client";

import { motion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";

export function Hero() {
  const scrollToCalculator = () => {
    document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="min-h-[80dvh] flex items-center justify-center bg-gradient-to-b from-blue-50/50 to-transparent">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-semibold tracking-tight text-slate-800"
        >
          Smart Loan
          <br />
          Decisions
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-lg text-slate-500 max-w-md mx-auto"
        >
          Our machine learning model analyzes 13 financial factors to predict loan approval with 93% accuracy.
        </motion.p>
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onClick={scrollToCalculator}
          className="mt-8 inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          Try the Predictor
          <ArrowRight className="w-4 h-4" />
        </motion.button>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400"
        >
          {["Python", "Flask", "scikit-learn", "Next.js"].map((tech, i) => (
            <span key={tech} className="flex items-center gap-2">
              {i > 0 && <span>·</span>}
              <span className="px-2 py-1 bg-slate-100 rounded text-slate-500">{tech}</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add Hero to page.tsx and verify**

```tsx
// frontend/app/page.tsx
import { Hero } from "@/components/Hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Hero />
    </main>
  );
}
```

Run: `npm run dev` and verify Hero renders at http://localhost:3000

- [ ] **Step 3: Commit**

```bash
git add frontend/components/Hero.tsx frontend/app/page.tsx
git commit -m "feat: add Hero section with headline, CTA, and tech badges"
```

### Task 2.4: Build Multi-Step Form Components

**Files:**
- Create: `frontend/components/StepPersonal.tsx`
- Create: `frontend/components/StepFinancial.tsx`
- Create: `frontend/components/StepContext.tsx`
- Create: `frontend/components/LoanCalculator.tsx`
- Create: `frontend/components/PredictionResult.tsx`

**Interfaces:**
- Consumes: `predict()` from api.ts
- Produces: Multi-step form with validation, result display

- [ ] **Step 1: Create StepPersonal (Step 1)**

```tsx
// frontend/components/StepPersonal.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StepPersonalProps {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function StepPersonal({ data, onChange, errors }: StepPersonalProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-800">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="Age">Age</Label>
          <Input
            id="Age"
            type="number"
            placeholder="e.g. 35"
            value={data.Age || ""}
            onChange={(e) => onChange("Age", e.target.value)}
            min={18}
            max={100}
          />
          {errors.Age && <p className="text-sm text-red-500">{errors.Age}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="Dependents">Dependents</Label>
          <Input
            id="Dependents"
            type="number"
            placeholder="e.g. 2"
            value={data.Dependents || ""}
            onChange={(e) => onChange("Dependents", e.target.value)}
            min={0}
            max={20}
          />
          {errors.Dependents && <p className="text-sm text-red-500">{errors.Dependents}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="Gender">Gender</Label>
          <Select value={data.Gender || ""} onValueChange={(v) => onChange("Gender", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Male</SelectItem>
              <SelectItem value="0">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="Married">Married</Label>
          <Select value={data.Married || ""} onValueChange={(v) => onChange("Married", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="Education">Education</Label>
          <Select value={data.Education || ""} onValueChange={(v) => onChange("Education", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create StepFinancial (Step 2)**

```tsx
// frontend/components/StepFinancial.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StepFinancialProps {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function StepFinancial({ data, onChange, errors }: StepFinancialProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-800">Financial Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ApplicantIncome">Income</Label>
          <Input
            id="ApplicantIncome"
            type="number"
            placeholder="e.g. 50000"
            value={data.ApplicantIncome || ""}
            onChange={(e) => onChange("ApplicantIncome", e.target.value)}
            min={0}
          />
          {errors.ApplicantIncome && <p className="text-sm text-red-500">{errors.ApplicantIncome}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="LoanAmount">Loan Amount</Label>
          <Input
            id="LoanAmount"
            type="number"
            placeholder="e.g. 200000"
            value={data.LoanAmount || ""}
            onChange={(e) => onChange("LoanAmount", e.target.value)}
            min={0}
          />
          {errors.LoanAmount && <p className="text-sm text-red-500">{errors.LoanAmount}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="Cibil_Score">CIBIL Score</Label>
          <Input
            id="Cibil_Score"
            type="number"
            placeholder="300-900"
            value={data.Cibil_Score || ""}
            onChange={(e) => onChange("Cibil_Score", e.target.value)}
            min={300}
            max={900}
          />
          <p className="text-xs text-slate-400">Most important factor</p>
          {errors.Cibil_Score && <p className="text-sm text-red-500">{errors.Cibil_Score}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="Tenure">Tenure (months)</Label>
          <Input
            id="Tenure"
            type="number"
            placeholder="e.g. 60"
            value={data.Tenure || ""}
            onChange={(e) => onChange("Tenure", e.target.value)}
            min={1}
            max={360}
          />
          {errors.Tenure && <p className="text-sm text-red-500">{errors.Tenure}</p>}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="Self_Employed">Self Employed</Label>
        <Select value={data.Self_Employed || ""} onValueChange={(v) => onChange("Self_Employed", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Yes</SelectItem>
            <SelectItem value="0">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create StepContext (Step 3)**

```tsx
// frontend/components/StepContext.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StepContextProps {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function StepContext({ data, onChange, errors }: StepContextProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-800">Loan Context</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="Previous_Loan_Taken">Previous Loan</Label>
          <Select value={data.Previous_Loan_Taken || ""} onValueChange={(v) => onChange("Previous_Loan_Taken", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="Property_Area">Property Area</Label>
          <Select value={data.Property_Area || ""} onValueChange={(v) => onChange("Property_Area", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Rural</SelectItem>
              <SelectItem value="1">Semiurban</SelectItem>
              <SelectItem value="2">Urban</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="Customer_Bandwith">Banking History</Label>
          <Select value={data.Customer_Bandwith || ""} onValueChange={(v) => onChange("Customer_Bandwith", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Bad</SelectItem>
              <SelectItem value="1">Good</SelectItem>
              <SelectItem value="2">Medium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create PredictionResult component**

```tsx
// frontend/components/PredictionResult.tsx
"use client";

import { motion } from "motion/react";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { PredictionResponse } from "@/lib/api";

interface PredictionResultProps {
  result: PredictionResponse;
  onTryAgain: () => void;
}

export function PredictionResult({ result, onTryAgain }: PredictionResultProps) {
  const isApproved = result.result === "approved";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl p-6 border ${
        isApproved
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        {isApproved ? (
          <CheckCircle className="w-8 h-8 text-green-600" weight="fill" />
        ) : (
          <XCircle className="w-8 h-8 text-red-600" weight="fill" />
        )}
        <h3 className={`text-xl font-semibold ${isApproved ? "text-green-600" : "text-red-600"}`}>
          Loan {isApproved ? "Approved" : "Rejected"}
        </h3>
      </div>
      
      <p className="text-slate-600 mb-4">
        {isApproved
          ? "Based on your inputs, our model predicts your loan would be approved."
          : "Based on your inputs, our model predicts your loan would not be approved at this time."}
      </p>
      
      {!isApproved && result.rejection_reasons && result.rejection_reasons.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Here's what may have affected the decision:</p>
          <div className="space-y-2">
            {result.rejection_reasons.map((reason, i) => (
              <div key={i} className="bg-white/60 rounded-lg p-3 border border-red-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700">{reason.label}</span>
                </div>
                <p className="text-sm text-slate-500">{reason.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Button variant="outline" onClick={onTryAgain}>
        Try Again
      </Button>
    </motion.div>
  );
}
```

- [ ] **Step 5: Create LoanCalculator (multi-step container)**

```tsx
// frontend/components/LoanCalculator.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Spinner } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { StepPersonal } from "./StepPersonal";
import { StepFinancial } from "./StepFinancial";
import { StepContext } from "./StepContext";
import { PredictionResult } from "./PredictionResult";
import { predict, type PredictionResponse } from "@/lib/api";

const STEPS = [
  { id: 1, label: "Personal" },
  { id: 2, label: "Financial" },
  { id: 3, label: "Context" },
];

const REQUIRED_FIELDS: Record<number, string[]> = {
  1: ["Age", "Dependents"],
  2: ["ApplicantIncome", "LoanAmount", "Cibil_Score", "Tenure"],
  3: ["Gender", "Married", "Education", "Self_Employed", "Previous_Loan_Taken", "Property_Area", "Customer_Bandwith"],
};

export function LoanCalculator() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const handleChange = (field: string, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateStep = (): boolean => {
    const fields = REQUIRED_FIELDS[step];
    const newErrors: Record<string, string> = {};
    
    for (const field of fields) {
      if (!data[field]) {
        newErrors[field] = "This field is required";
      }
    }
    
    // Validate CIBIL score range
    if (step === 2 && data.Cibil_Score) {
      const score = parseInt(data.Cibil_Score);
      if (score < 300 || score > 900) {
        newErrors.Cibil_Score = "CIBIL score must be between 300 and 900";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, 3));
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    setLoading(true);
    try {
      const input = {
        Age: parseInt(data.Age || "0"),
        Dependents: parseInt(data.Dependents || "0"),
        ApplicantIncome: parseInt(data.ApplicantIncome || "0"),
        LoanAmount: parseInt(data.LoanAmount || "0"),
        Cibil_Score: parseInt(data.Cibil_Score || "0"),
        Tenure: parseInt(data.Tenure || "0"),
        Gender: parseInt(data.Gender || "0"),
        Married: parseInt(data.Married || "0"),
        Education: parseInt(data.Education || "0"),
        Self_Employed: parseInt(data.Self_Employed || "0"),
        Previous_Loan_Taken: parseInt(data.Previous_Loan_Taken || "0"),
        Property_Area: parseInt(data.Property_Area || "0"),
        Customer_Bandwith: parseInt(data.Customer_Bandwith || "0"),
      };
      const res = await predict(input);
      setResult(res);
    } catch {
      setErrors({ submit: "Failed to get prediction. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setResult(null);
    setStep(1);
    setData({});
    setErrors({});
  };

  return (
    <div id="calculator" className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Progress Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step > s.id
                      ? "bg-blue-500 text-white"
                      : step === s.id
                      ? "bg-blue-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {step > s.id ? "✓" : s.id}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    step >= s.id ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 mx-2 ${
                    step > s.id ? "bg-blue-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="p-6">
          {result ? (
            <PredictionResult result={result} onTryAgain={handleTryAgain} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === 1 && <StepPersonal data={data} onChange={handleChange} errors={errors} />}
                {step === 2 && <StepFinancial data={data} onChange={handleChange} errors={errors} />}
                {step === 3 && <StepContext data={data} onChange={handleChange} errors={errors} />}
              </motion.div>
            </AnimatePresence>
          )}

          {errors.submit && (
            <p className="mt-4 text-sm text-red-500 text-center">{errors.submit}</p>
          )}
        </div>

        {/* Navigation */}
        {!result && (
          <div className="flex justify-between px-6 py-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            {step < 3 ? (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Spinner className="w-4 h-4 animate-spin" />
                    Predicting...
                  </>
                ) : (
                  "Get Prediction"
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Add to page.tsx and verify**

Update `frontend/app/page.tsx`:

```tsx
import { Hero } from "@/components/Hero";
import { LoanCalculator } from "@/components/LoanCalculator";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Hero />
      <LoanCalculator />
    </main>
  );
}
```

Run: `npm run dev` and verify form works end-to-end

- [ ] **Step 7: Commit**

```bash
git add frontend/components/ frontend/app/page.tsx
git commit -m "feat: add multi-step form with validation and prediction result"
```

### Task 2.5: Build Feature Importance and Stats Components

**Files:**
- Create: `frontend/components/FeatureImportance.tsx`
- Create: `frontend/components/StatsBar.tsx`
- Create: `frontend/components/Footer.tsx`

**Interfaces:**
- Consumes: `getStats()` from api.ts
- Produces: Feature importance bars, stats display, footer

- [ ] **Step 1: Create FeatureImportance component**

```tsx
// frontend/components/FeatureImportance.tsx
"use client";

import { motion } from "motion/react";

const FEATURES = [
  { name: "CIBIL Score", importance: 29, explanation: "Your credit history is the single biggest factor. A score above 750 significantly improves your chances." },
  { name: "Banking History", importance: 20, explanation: "How well you've managed your banking relationships matters more than you'd think." },
  { name: "Loan Amount", importance: 15, explanation: "Smaller loans relative to your income are easier to get approved." },
  { name: "Income", importance: 12, explanation: "Higher income demonstrates you have the capacity to repay." },
  { name: "Education", importance: 8, explanation: "Higher education often correlates with employment stability." },
  { name: "Other factors", importance: 16, explanation: "Gender, marital status, property area, and tenure each contribute less than 5%." },
];

export function FeatureImportance() {
  return (
    <section className="max-w-2xl mx-auto px-4 py-16">
      <h2 className="text-2xl font-semibold text-slate-800 mb-2">How The Model Decides</h2>
      <p className="text-slate-500 mb-8">Not all factors carry equal weight. Here's what matters most.</p>
      
      <div className="space-y-6">
        {FEATURES.map((feature, i) => (
          <div key={feature.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">{feature.name}</span>
              <span className="text-sm font-mono text-slate-500">{feature.importance}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${feature.importance}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{feature.explanation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create StatsBar component**

```tsx
// frontend/components/StatsBar.tsx
"use client";

import { useEffect, useState } from "react";
import { getStats, type StatsResponse } from "@/lib/api";

export function StatsBar() {
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  return (
    <div className="border-t border-b border-slate-200 bg-white">
      <div className="max-w-2xl mx-auto px-4 py-4 text-center">
        {stats && stats.total > 0 ? (
          <p className="text-sm text-slate-400">
            <span className="font-medium text-slate-600">{stats.total.toLocaleString()}</span> predictions made ·{" "}
            <span className="font-medium text-slate-600">{stats.approval_rate}%</span> approved
          </p>
        ) : (
          <div className="h-4 bg-slate-100 rounded animate-pulse max-w-xs mx-auto" />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Footer component**

```tsx
// frontend/components/Footer.tsx
import { GithubLogo } from "@phosphor-icons/react/dist/ssr/GithubLogo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-sm text-slate-400 mb-4">
          Built with Next.js · Flask · scikit-learn · Neon DB
        </p>
        <a
          href="https://github.com/prem-thatikonda29/bank-loan-prediction"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <GithubLogo className="w-4 h-4" />
          View Source
        </a>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Update page.tsx with all sections**

```tsx
// frontend/app/page.tsx
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { LoanCalculator } from "@/components/LoanCalculator";
import { FeatureImportance } from "@/components/FeatureImportance";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Hero />
      <StatsBar />
      <LoanCalculator />
      <FeatureImportance />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 5: Verify full page renders**

Run: `npm run dev`
Expected: Hero → Stats → Calculator → Feature Importance → Footer, all styled correctly

- [ ] **Step 6: Commit**

```bash
git add frontend/components/FeatureImportance.tsx frontend/components/StatsBar.tsx frontend/components/Footer.tsx frontend/app/page.tsx
git commit -m "feat: add feature importance bars, stats display, and footer"
```

### Task 2.6: Final Polish and Deployment Config

**Files:**
- Modify: `frontend/next.config.ts`
- Create: `frontend/.env.production`

**Interfaces:**
- Consumes: all components
- Produces: production-ready config

- [ ] **Step 1: Update next.config.ts for API proxy**

```typescript
// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 2: Create production env**

```
NEXT_PUBLIC_API_URL=https://bank-loan-prediction-vlx3.onrender.com
```

- [ ] **Step 3: Test production build**

```bash
npm run build
npm run start
```
Expected: App builds and runs without errors

- [ ] **Step 4: Commit**

```bash
git add frontend/next.config.ts frontend/.env.production
git commit -m "chore: add production config for Vercel deployment"
```

- [ ] **Step 5: Push all changes**

```bash
git push origin master
```

---

## Summary

| Phase | Tasks | Deliverable |
|-------|-------|-------------|
| Phase 0 | 1 task | Improved model (`build_v2.pkl`) |
| Phase 1 | 2 tasks | Flask API with CORS, rejection reasons, stats |
| Phase 2 | 6 tasks | Next.js SPA with multi-step form, result display, feature importance |
