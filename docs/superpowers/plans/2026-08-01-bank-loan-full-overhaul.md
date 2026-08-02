# Bank Loan Prediction — Full Overhaul Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Bank Loan Prediction app production-ready with proper dependency management, error handling, input validation, a WSGI server, containerization, and deployment configuration.

**Architecture:** Refactor the single-file Flask app into a clean structure with environment-based config, add gunicorn as the WSGI server, containerize with Docker, and add deployment configs for Render/Railway.

**Tech Stack:** Python 3.12, Flask 3.1.3, scikit-learn 1.9.0, gunicorn, Docker

## Global Constraints

- Python 3.12 (already in `.venv`)
- Flask 3.1.3 (current version)
- scikit-learn 1.9.0 (current version)
- Model file: `build.pkl` (Decision Tree, ~2.1 KB)
- Must remain compatible with existing `Bank_Loan.csv` and notebook

---

## File Structure (After Overhaul)

```
/Users/premthatikonda/Downloads/cloud/
├── app.py                          # Refactored Flask app (main entry)
├── build.pkl                       # ML model (unchanged)
├── Bank_Loan.csv                   # Training data (unchanged)
├── BankLoanPredictionDeployment.ipynb  # Notebook (unchanged)
├── requirements.txt                # NEW — pinned dependencies
├── gunicorn.conf.py                # NEW — gunicorn config
├── Dockerfile                      # NEW — container definition
├── .dockerignore                   # NEW — Docker build exclusions
├── .gitignore                      # NEW — git exclusions
├── render.yaml                     # NEW — Render deployment
├── Procfile                        # NEW — Heroku deployment
├── template/
│   └── index.html                  # Improved HTML form
└── staticfiles/
    └── style.css                   # Improved CSS
```

---

### Task 1: Add `.gitignore`

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create `.gitignore`**

```
.venv/
__pycache__/
*.pyc
*.pyo
.env
.env.local
*.pkl
.DS_Store
.vscode/
.idea/
```

- [ ] **Step 2: Commit**

```bash
git init && git add .gitignore && git commit -m "chore: add .gitignore"
```

---

### Task 2: Add `requirements.txt`

**Files:**
- Create: `requirements.txt`

**Interfaces:**
- Consumes: current `.venv` packages
- Produces: `requirements.txt` used by `pip install -r` in Dockerfile and deployment

- [ ] **Step 1: Create `requirements.txt`**

```
flask==3.1.3
gunicorn==23.0.0
numpy==2.5.1
pandas==3.0.5
scikit-learn==1.9.0
```

- [ ] **Step 2: Verify it matches installed packages**

Run: `pip list --format=columns | grep -iE "flask|gunicorn|numpy|pandas|scikit"`

- [ ] **Step 3: Commit**

```bash
git add requirements.txt && git commit -m "chore: add requirements.txt with pinned dependencies"
```

---

### Task 3: Add `gunicorn.conf.py`

**Files:**
- Create: `gunicorn.conf.py`

**Interfaces:**
- Consumes: environment variables `PORT` (default 9000), `WORKERS` (default 2)
- Produces: gunicorn configuration for production server

- [ ] **Step 1: Create `gunicorn.conf.py`**

```python
import os

bind = f"0.0.0.0:{os.environ.get('PORT', '9000')}"
workers = int(os.environ.get("WORKERS", "2"))
worker_class = "sync"
timeout = 120
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
```

- [ ] **Step 2: Commit**

```bash
git add gunicorn.conf.py && git commit -m "chore: add gunicorn config for production server"
```

---

### Task 4: Refactor `app.py` with error handling and input validation

**Files:**
- Modify: `app.py`

**Interfaces:**
- Consumes: `build.pkl` model, form data from `index.html`
- Produces: prediction response with proper error handling

- [ ] **Step 1: Rewrite `app.py`**

```python
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
```

- [ ] **Step 2: Run the app to verify it starts**

Run: `python app.py`
Expected: App starts on port 9000 with "Model loaded successfully" log message. Press Ctrl+C to stop.

- [ ] **Step 3: Test the health endpoint**

Run: `curl http://localhost:9000/health`
Expected: `{"model_loaded":true,"status":"healthy"}`

- [ ] **Step 4: Test form submission**

Run: `curl -X POST http://localhost:9000/predict -d "Age=35&Dependents=2&ApplicantIncome=50000&LoanAmount=200000&Cibil_Score=750&Tenure=60&Gender=1&Married=1&Education=1&Self_Employed=0&Previous_Loan_Taken=0&Property_Area=2&Customer_Bandwith=1"`
Expected: HTML response containing either "Loan is Approved" or "Loan is Rejected"

- [ ] **Step 5: Test validation (missing field)**

Run: `curl -X POST http://localhost:9000/predict -d "Age=35"`
Expected: 400 response with "Missing required field" message

- [ ] **Step 6: Commit**

```bash
git add app.py && git commit -m "feat: refactor app with input validation, error handling, and health check"
```

---

### Task 5: Improve `index.html`

**Files:**
- Modify: `template/index.html`

**Interfaces:**
- Consumes: `prediction_text` template variable from `app.py`
- Produces: improved form UI

- [ ] **Step 1: Rewrite `template/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bank Loan Prediction</title>
    <link rel="stylesheet" href="/staticfiles/style.css">
</head>
<body>
    <div class="container">
        <h1>Bank Loan Prediction</h1>
        <form action="{{ url_for('predict') }}" method="post">
            <div class="form-group">
                <label for="Age">Customer Age</label>
                <input type="number" name="Age" id="Age" placeholder="e.g. 35" required min="18" max="100">
            </div>
            <div class="form-group">
                <label for="Dependents">Family Members</label>
                <input type="number" name="Dependents" id="Dependents" placeholder="e.g. 2" required min="0" max="20">
            </div>
            <div class="form-group">
                <label for="ApplicantIncome">Income</label>
                <input type="number" name="ApplicantIncome" id="ApplicantIncome" placeholder="e.g. 50000" required min="0">
            </div>
            <div class="form-group">
                <label for="LoanAmount">Loan Amount</label>
                <input type="number" name="LoanAmount" id="LoanAmount" placeholder="e.g. 200000" required min="0">
            </div>
            <div class="form-group">
                <label for="Cibil_Score">CIBIL Score</label>
                <input type="number" name="Cibil_Score" id="Cibil_Score" placeholder="e.g. 750" required min="300" max="900">
            </div>
            <div class="form-group">
                <label for="Tenure">Tenure (months)</label>
                <input type="number" name="Tenure" id="Tenure" placeholder="e.g. 60" required min="1" max="360">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="Gender">Gender</label>
                    <select name="Gender" id="Gender" required>
                        <option value="1">Male</option>
                        <option value="0">Female</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="Married">Married</label>
                    <select name="Married" id="Married" required>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="Education">Education</label>
                    <select name="Education" id="Education" required>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="Self_Employed">Self Employed</label>
                    <select name="Self_Employed" id="Self_Employed" required>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="Previous_Loan_Taken">Previous Loan</label>
                    <select name="Previous_Loan_Taken" id="Previous_Loan_Taken" required>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="Property_Area">Property Area</label>
                    <select name="Property_Area" id="Property_Area" required>
                        <option value="0">Rural</option>
                        <option value="1">Semiurban</option>
                        <option value="2">Urban</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="Customer_Bandwith">Customer Bandwidth</label>
                    <select name="Customer_Bandwith" id="Customer_Bandwith" required>
                        <option value="0">Bad</option>
                        <option value="1">Good</option>
                        <option value="2">Medium</option>
                    </select>
                </div>
            </div>

            <button type="submit" class="btn">Get Prediction</button>
        </form>

        {% if prediction_text %}
        <div class="result">{{ prediction_text }}</div>
        {% endif %}
    </div>
</body>
</html>
```

- [ ] **Step 2: Update `staticfiles/style.css`**

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background-color: #f5f5f5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #333;
}

.container {
    max-width: 600px;
    margin: 40px auto;
    padding: 30px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

h1 {
    text-align: center;
    margin-bottom: 24px;
    font-size: 24px;
    color: #1a1a1a;
}

.form-group {
    margin-bottom: 16px;
}

label {
    display: block;
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 500;
    color: #555;
}

input[type="number"], select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.2s;
}

input[type="number"]:focus, select:focus {
    outline: none;
    border-color: #007780;
}

.form-row {
    display: flex;
    gap: 12px;
}

.form-row .form-group {
    flex: 1;
}

.btn {
    width: 100%;
    padding: 12px;
    background-color: #007780;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 8px;
    transition: background-color 0.2s;
}

.btn:hover {
    background-color: #005f66;
}

.result {
    margin-top: 20px;
    padding: 16px;
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    border-radius: 8px;
    background-color: #e8f5e9;
    color: #2e7d32;
}
```

- [ ] **Step 3: Commit**

```bash
git add template/index.html staticfiles/style.css && git commit -m "feat: improve form UI with labels, validation, and responsive layout"
```

---

### Task 6: Add Dockerfile and `.dockerignore`

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

**Interfaces:**
- Consumes: `requirements.txt`, `app.py`, `build.pkl`, `template/`, `staticfiles/`
- Produces: Docker image definition

- [ ] **Step 1: Create `.dockerignore`**

```
.venv/
__pycache__/
*.pyc
.git/
.gitignore
.env
*.md
.vscode/
.idea/
BankLoanPredictionDeployment.ipynb
```

- [ ] **Step 2: Create `Dockerfile`**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY build.pkl .
COPY template/ template/
COPY staticfiles/ staticfiles/
COPY gunicorn.conf.py .

EXPOSE 9000

CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:app"]
```

- [ ] **Step 3: Test Docker build**

Run: `docker build -t bank-loan-prediction .`
Expected: Build completes successfully

- [ ] **Step 4: Test Docker run**

Run: `docker run -p 9000:9000 bank-loan-prediction`
Expected: App starts, accessible at http://localhost:9000

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore && git commit -m "feat: add Dockerfile for containerized deployment"
```

---

### Task 7: Add deployment configs (Render + Heroku)

**Files:**
- Create: `render.yaml`
- Create: `Procfile`

**Interfaces:**
- Consumes: `requirements.txt`, `Dockerfile`, `gunicorn.conf.py`
- Produces: deployment manifests

- [ ] **Step 1: Create `Procfile` (Heroku)**

```
web: gunicorn -c gunicorn.conf.py app:app
```

- [ ] **Step 2: Create `render.yaml` (Render)**

```yaml
services:
  - type: web
    name: bank-loan-prediction
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn -c gunicorn.conf.py app:app
    envVars:
      - key: PORT
        value: 9000
```

- [ ] **Step 3: Commit**

```bash
git add Procfile render.yaml && git commit -m "chore: add deployment configs for Render and Heroku"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run the app locally**

Run: `python app.py`
Expected: App starts on port 9000

- [ ] **Step 2: Test health endpoint**

Run: `curl http://localhost:9000/health`
Expected: `{"model_loaded":true,"status":"healthy"}`

- [ ] **Step 3: Test form page**

Run: `curl http://localhost:9000/`
Expected: HTML form renders correctly

- [ ] **Step 4: Test prediction**

Run: `curl -X POST http://localhost:9000/predict -d "Age=35&Dependents=2&ApplicantIncome=50000&LoanAmount=200000&Cibil_Score=750&Tenure=60&Gender=1&Married=1&Education=1&Self_Employed=0&Previous_Loan_Taken=0&Property_Area=2&Customer_Bandwith=1"`
Expected: Response with "Loan is Approved" or "Loan is Rejected"

- [ ] **Step 5: Test gunicorn**

Run: `gunicorn -c gunicorn.conf.py app:app`
Expected: Server starts on port 9000, responds to requests

- [ ] **Step 6: Final commit**

```bash
git add -A && git commit -m "chore: final verification and cleanup"
```
