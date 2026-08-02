# Bank Loan Prediction — Next.js Frontend Design Spec

> **Status:** Draft
> **Date:** 2026-08-02
> **Target:** Portfolio demo SPA for ML loan predictor

## Overview

Redesign the bank loan prediction app as a modern Next.js SPA with a professional UI, multi-step form, feature importance visualization, and prediction stats stored in Neon DB. The Flask backend stays as-is with added JSON API endpoints.

**Prerequisite:** Improve the ML model before building the frontend. The current model has critical issues (synthetic data patterns, class imbalance, 2-feature dependency) that would be obvious to any interviewer.

## Goals

1. Improve the ML model to be portfolio-worthy (handle class imbalance, feature engineering, better algorithm)
2. Make the project portfolio-worthy for an ML-focused role
3. Demonstrate frontend engineering skills alongside ML knowledge
4. Provide excellent UX with multi-step form, loading states, and clear results
5. Show model interpretability — explain WHY a loan was rejected, not just that it was
6. Store prediction history for aggregate stats
7. Deploy frontend on Vercel, backend on Render

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js | 16.x (latest) |
| UI Library | React | 19.x (comes with Next 16) |
| Styling | Tailwind CSS | 4.x |
| Component Library | shadcn/ui | latest |
| Animation | motion/react | latest |
| Icons | @phosphor-icons/react | latest |
| Backend | Flask | 3.1.3 (existing) |
| Database | Neon DB (PostgreSQL) | serverless |
| Frontend Deploy | Vercel | — |
| Backend Deploy | Render | — |

## Phase 0: Model Improvements (Before Frontend)

The current model has critical issues that must be fixed before building the portfolio frontend.

### Current Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| Class imbalance (72% rejected) | Model defaults to "rejected" for high accuracy | SMOTE or class weights |
| Only 2 features matter (94.7%) | Model is essentially a 2-variable rule | Feature engineering + better algorithm |
| No cross-validation | Single lucky split | Stratified 5-fold CV |
| Synthetic data patterns | Inverted CIBIL scores, weird bandwidth | Document limitations, use robust model |
| No probability calibration | Hard classes only | CalibratedClassifierCV |

### Improvement Plan

#### Step 1: Feature Engineering

Create new features from existing data:

```python
# Income-to-Loan ratio (strong predictor in real lending)
df['Income_Loan_Ratio'] = df['ApplicantIncome'] / df['LoanAmount']

# Loan burden (monthly payment estimate)
df['Loan_Burden'] = df['LoanAmount'] / df['Tenure']

# Income per dependent
df['Income_Per_Dependent'] = df['ApplicantIncome'] / (df['Dependents'] + 1)

# CIBIL bins (risk categories)
df['Cibil_Risk'] = pd.cut(df['Cibil_Score'], bins=[0, 600, 700, 900], labels=['High', 'Medium', 'Low'])
```

#### Step 2: Handle Class Imbalance

Use class weights to tell the model that both outcomes are equally important:

```python
# Instead of:
model = RandomForestClassifier()

# Use:
model = RandomForestClassifier(class_weight='balanced')
```

**Why class weights over SMOTE:** SMOTE generates synthetic data which can introduce artifacts. Class weights achieve balanced learning without modifying the training data — the model just pays equal attention to both classes during training.

#### Step 3: Try Better Models

Compare multiple algorithms:

```python
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier

models = {
    'Logistic Regression': LogisticRegression(max_iter=1000),
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
    'XGBoost': XGBClassifier(n_estimators=100, random_state=42, use_label_encoder=False),
}
```

Select the best model based on:
- **F1-score for "Approved" class** (not overall accuracy)
- **Recall for "Approved"** (catch creditworthy applicants)
- **Cross-validation stability**

#### Step 4: Cross-Validation

```python
from sklearn.model_selection import StratifiedKFold, cross_val_score

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X, y, cv=cv, scoring='f1')
```

#### Step 5: Probability Calibration

```python
from sklearn.calibration import CalibratedClassifierCV

calibrated_model = CalibratedClassifierCV(model, cv=5, method='isotonic')
calibrated_model.fit(X_train, y_train)

# Now we can get calibrated probabilities
prob = calibrated_model.predict_proba(X_new)[:, 1]  # probability of approval
```

#### Step 6: Feature Importance (New Model)

After retraining, extract feature importances:

```python
# For tree-based models
importances = model.feature_importances_
feature_names = X.columns

# Sort by importance
sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
```

### Expected Outcome

| Metric | Current | Target |
|--------|---------|--------|
| Accuracy | 91.37% | 85-90% (may drop due to balanced data) |
| Recall (Approved) | 79% | 85%+ |
| F1 (Approved) | 84% | 85%+ |
| Features used | 2 (94.7%) | 5-8 meaningful features |
| Cross-validation | None | 5-fold stratified |
| Probability output | No | Yes (calibrated) |

### New Model File

After improvements, save as `build_v2.pkl`:

```python
import pickle

with open('build_v2.pkl', 'wb') as f:
    pickle.dump(calibrated_model, f)
```

The backend will load `build_v2.pkl` instead of `build.pkl`.

## Architecture

```
bank-loan-prediction/
├── app.py                          # Flask backend (modified)
├── build.pkl                       # ML model (unchanged)
├── Bank_Loan.csv                   # Training data (unchanged)
├── BankLoanPredictionDeployment.ipynb  # Notebook (unchanged)
├── requirements.txt                # Updated with new deps
├── gunicorn.conf.py                # Existing
├── Dockerfile                      # Existing
├── .gitignore                      # Existing
├── Procfile                        # Existing
├── render.yaml                     # Existing
│
└── frontend/                       # Next.js app (NEW)
    ├── app/
    │   ├── page.tsx                # Main landing page
    │   ├── layout.tsx              # Root layout (fonts, metadata)
    │   └── globals.css             # Tailwind base + custom tokens
    ├── components/
    │   ├── ui/                     # shadcn/ui components
    │   ├── Hero.tsx                # Hero section
    │   ├── StatsBar.tsx            # Prediction counter
    │   ├── LoanCalculator.tsx      # Multi-step form container
    │   ├── StepPersonal.tsx        # Step 1: Personal info
    │   ├── StepFinancial.tsx       # Step 2: Financial info
    │   ├── StepContext.tsx         # Step 3: Loan context
    │   ├── PredictionResult.tsx    # Result card (approved/rejected)
    │   ├── FeatureImportance.tsx   # Bar chart + explanations
    │   └── Footer.tsx              # Tech stack, GitHub link
    ├── lib/
    │   ├── api.ts                  # API client for Flask backend
    │   └── utils.ts                # shadcn/ui cn() helper
    ├── drizzle/
    │   └── schema.ts               # Database schema (Drizzle)
    ├── public/                     # Static assets
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── package.json
    └── .env.local                  # DATABASE_URL, API_URL
```

## Color Palette

Light theme with subtle blue hues and pastel accents.

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Background | `#f8fafc` | `bg-slate-50` | Page background |
| Surface | `#ffffff` | `bg-white` | Cards, forms |
| Primary | `#3b82f6` | `blue-500` | Buttons, active steps |
| Primary Light | `#dbeafe` | `blue-100` | Step highlights, badges |
| Primary Dark | `#1e40af` | `blue-800` | Hover states |
| Text | `#1e293b` | `slate-800` | Headings |
| Text Muted | `#64748b` | `slate-500` | Descriptions |
| Border | `#e2e8f0` | `slate-200` | Dividers, inputs |
| Success Bg | `#dcfce7` | `green-100` | Approved card bg |
| Success Text | `#16a34a` | `green-600` | Approved text |
| Success Border | `#bbf7d0` | `green-200` | Approved card border |
| Error Bg | `#fee2e2` | `red-100` | Rejected card bg |
| Error Text | `#dc2626` | `red-600` | Rejected text |
| Error Border | `#fecaca` | `red-200` | Rejected card border |

## Page Sections

### 1. Hero

- **Headline:** "Smart Loan Decisions" (text-5xl md:text-6xl, font-semibold, tracking-tight)
- **Subtext:** "Our machine learning model analyzes 13 financial factors to predict loan approval with 93% accuracy." (max 25 words, text-slate-500)
- **CTA:** "Try the Predictor →" (blue-500 button, scrolls to calculator)
- **Tech badges:** Subtle pill badges below CTA: "Python · Flask · scikit-learn · Next.js"
- **Layout:** Centered, max-w-2xl, min-h-[80dvh] flex items-center
- **Background:** White with very subtle blue gradient at top (`bg-gradient-to-b from-blue-50/50 to-transparent`)

### 2. Stats Bar

- Horizontal bar between hero and calculator
- Centered text: "1,247 predictions made · 68% approved"
- Numbers fetched from `GET /api/stats` on mount
- Subtle styling: text-sm text-slate-400, with a thin border separator
- Loading state: skeleton placeholder with pulse animation

### 3. Loan Calculator (Multi-Step Form)

**Container:** White card with subtle shadow, max-w-xl, centered

**Progress Bar (top of card):**
```
Step 1: Personal    Step 2: Financial    Step 3: Context
   ● ─────────────────○ ─────────────────○
```
- Active step: blue-500 dot + bold label
- Completed step: blue-500 dot with checkmark
- Upcoming step: slate-300 dot + muted label
- Connecting line: blue-500 for completed, slate-200 for upcoming

**Step 1 — Personal Info (5 fields):**
| Field | Type | Options/Range |
|-------|------|---------------|
| Age | number input | 18-100, required |
| Dependents | number input | 0-20, required |
| Gender | select | Male / Female |
| Married | select | Yes / No |
| Education | select | Yes / No |

**Step 2 — Financial Info (5 fields):**
| Field | Type | Options/Range |
|-------|------|---------------|
| Applicant Income | number input | min 0, required |
| Loan Amount | number input | min 0, required |
| CIBIL Score | number input | 300-900, required, helper text: "Most important factor" |
| Tenure (months) | number input | 1-360, required |
| Self Employed | select | Yes / No |

**Step 3 — Loan Context (3 fields):**
| Field | Type | Options/Range |
|-------|------|---------------|
| Previous Loan Taken | select | Yes / No |
| Property Area | select | Rural / Semiurban / Urban |
| Customer Bandwidth | select | Bad / Good / Medium |

**Navigation:**
- Step 1: [Next →] only (no back button)
- Step 2: [← Back] [Next →]
- Step 3: [← Back] [Get Prediction] (with loading spinner on click)

**Validation:**
- All fields required (HTML `required` + JS validation)
- Validate on "Next" click, not on blur
- Show inline error messages below each invalid field
- CIBIL Score: must be 300-900
- Number fields: must be positive integers

### 4. Prediction Result

Replaces the form on submission (form hides, result shows in same card location).

**Approved:**
```
┌─────────────────────────────────────┐
│  ✓                                  │  ← green checkmark circle
│  Loan Approved                      │  ← green-600, text-xl, font-semibold
│                                     │
│  Based on your inputs, our model    │
│  predicts your loan would be        │  ← slate-500 text
│  approved.                          │
│                                     │
│  [Try Again]                        │  ← outline button
└─────────────────────────────────────┘
```
- Background: green-50
- Border: green-200
- Icon: green-600 checkmark in green-100 circle

**Rejected:**
```
┌─────────────────────────────────────┐
│  ✕                                  │  ← red-600 X circle
│  Loan Rejected                      │  ← red-600, text-xl, font-semibold
│                                     │
│  Based on your inputs, our model    │
│  predicts your loan would not be    │  ← slate-500 text
│  approved at this time.             │
│                                     │
│  Here's what may have affected      │
│  the decision:                      │  ← section header
│                                     │
│  ┌───────────────────────────────┐  │
│  │ CIBIL Score                   │  │  ← problem field card
│  │ Your score: 580               │  │
│  │ Typical approved: 720+        │  │
│  │ ─────────────────────────── │  │
│  │ Income                        │  │
│  │ Your income: 25,000           │  │
│  │ Typical approved: 45,000+     │  │
│  └───────────────────────────────┘  │
│                                     │
│  [Try Again]                        │  ← outline button
└─────────────────────────────────────┘
```
- Background: red-50
- Border: red-200
- Icon: red-600 X in red-100 circle
- Rejection reasons: listed as mini-cards inside the result
  - Each card: feature name, user value vs typical approved, brief explanation
  - Max 3 reasons shown (most impactful first)
  - Subtle red-tinted cards (red-50 bg, red-100 border)

**Try Again:** Resets form to Step 1, clears all inputs.

### 5. Feature Importance Section

Below the calculator, max-w-2xl, centered.

**Title:** "How The Model Decides" (text-2xl, font-semibold, slate-800)
**Subtitle:** "Not all factors carry equal weight. Here's what matters most." (text-slate-500)

**Feature bars (sorted by importance):**

| Feature | Importance | Human Explanation |
|---------|-----------|-------------------|
| CIBIL Score | 29% | Your credit history is the biggest factor. A score above 750 significantly improves your chances. |
| Customer Bandwidth | 20% | How well you've managed your banking relationships matters more than you'd think. |
| Loan Amount | 15% | Smaller loans relative to your income are easier to get approved. |
| Applicant Income | 12% | Higher income demonstrates you have the capacity to repay. |
| Education | 8% | Higher education often correlates with employment stability. |
| Other factors | 16% | Gender, marital status, property area, and tenure each contribute less than 5%. |

**Bar design:**
- Horizontal bars, max-w-full
- Bar fill: blue-500 with smooth width transition (CSS transition or motion)
- Percentage label: right-aligned, text-sm, font-mono
- Feature name: left-aligned, text-sm, font-medium, slate-700
- Explanation: below the bar, text-xs, slate-500
- Bars animate in on scroll (motion `whileInView`)

### 6. Footer

- Minimal, centered
- Tech stack: "Built with Next.js · Flask · scikit-learn · Neon DB"
- GitHub link: "View Source" with GitHub icon
- Subtle border-t separator from content above

## Backend Changes (Flask)

### New Dependencies

Add to `requirements.txt`:
```
flask-cors==5.0.1
psycopg2-binary==2.9.10
```

### New Endpoints

**POST /api/predict**
```json
// Request
{
  "Age": 35,
  "Dependents": 2,
  "ApplicantIncome": 50000,
  "LoanAmount": 200000,
  "Cibil_Score": 750,
  "Tenure": 60,
  "Gender": 1,
  "Married": 1,
  "Education": 1,
  "Self_Employed": 0,
  "Previous_Loan_Taken": 0,
  "Property_Area": 2,
  "Customer_Bandwith": 1
}

// Response (approved)
{
  "prediction": 1,
  "result": "approved",
  "message": "Loan is Approved"
}

// Response (rejected — with reasons)
{
  "prediction": 0,
  "result": "rejected",
  "message": "Loan is Rejected",
  "rejection_reasons": [
    {
      "feature": "Cibil_Score",
      "label": "CIBIL Score",
      "user_value": 580,
      "typical_approved": 720,
      "explanation": "Your CIBIL score of 580 is below the typical approval range (720+)"
    },
    {
      "feature": "ApplicantIncome",
      "label": "Income",
      "user_value": 25000,
      "typical_approved": 45000,
      "explanation": "Your income of 25,000 is below the average for approved loans (45,000+)"
    }
  ]
}
```

- Validates all 13 fields
- Runs model prediction
- If rejected: computes rejection reasons by comparing inputs against typical approved values
- Stores prediction in Neon DB
- Returns JSON response with rejection reasons (if rejected)

**GET /api/stats**
```json
// Response
{
  "total": 1247,
  "approved": 848,
  "rejected": 399,
  "approval_rate": 68.0
}
```

- Queries Neon DB for aggregate counts
- Returns stats as JSON

### Rejection Reasons Logic

When a prediction is rejected, the backend identifies which features contributed most to the rejection by comparing the user's inputs against "typical approved" values derived from the training data.

**How it works:**

1. **Pre-computed thresholds** — Analyze `Bank_Loan.csv` at startup to compute median values for approved loans:

```python
# Computed from training data (example values)
APPROVED_THRESHOLDS = {
    "Age": {"median": 32, "min": 21},
    "Dependents": {"median": 1},
    "ApplicantIncome": {"median": 45000, "min": 20000},
    "LoanAmount": {"median": 150000, "max": 300000},
    "Cibil_Score": {"median": 720, "min": 650},
    "Tenure": {"median": 36},
    "Gender": {"mode": 1},          # Male
    "Married": {"mode": 1},         # Yes
    "Education": {"mode": 1},       # Yes
    "Self_Employed": {"mode": 0},   # No
    "Previous_Loan_Taken": {"mode": 0},  # No
    "Property_Area": {"mode": 2},   # Urban
    "Customer_Bandwith": {"mode": 1},    # Good
}
```

2. **Compare user input** — For each feature, check if the user's value falls outside the typical approved range:

```python
def compute_rejection_reasons(inputs: dict) -> list[dict]:
    reasons = []
    for feature, thresholds in APPROVED_THRESHOLDS.items():
        user_val = inputs[feature]
        
        # For numeric features with min threshold
        if "min" in thresholds and user_val < thresholds["min"]:
            reasons.append({
                "feature": feature,
                "label": FEATURE_LABELS[feature],
                "user_value": user_val,
                "typical_approved": thresholds["min"],
                "explanation": f"Your {FEATURE_LABELS[feature]} of {user_val} is below the typical approval threshold ({thresholds['min']}+)"
            })
        
        # For numeric features with max threshold (e.g., LoanAmount)
        if "max" in thresholds and user_val > thresholds["max"]:
            reasons.append({
                "feature": feature,
                "label": FEATURE_LABELS[feature],
                "user_value": user_val,
                "typical_approved": thresholds["max"],
                "explanation": f"Your {FEATURE_LABELS[feature]} of {user_val} exceeds the typical range (under {thresholds['max']})"
            })
        
        # For categorical features with mode (most common in approved)
        if "mode" in thresholds and user_val != thresholds["mode"]:
            # Only flag if the feature is important (importance > 5%)
            if FEATURE_IMPORTANCE.get(feature, 0) > 0.05:
                reasons.append({
                    "feature": feature,
                    "label": FEATURE_LABELS[feature],
                    "user_value": user_val,
                    "typical_approved": thresholds["mode"],
                    "explanation": f"Most approved loans have {FEATURE_LABELS[feature]} = {LABEL_MAPPINGS[feature][thresholds['mode']]}, yours is {LABEL_MAPPINGS[feature][user_val]}"
                })
    
    # Sort by importance (CIBIL Score first, etc.)
    reasons.sort(key=lambda x: FEATURE_IMPORTANCE.get(x["feature"], 0), reverse=True)
    
    # Return top 3 most impactful reasons
    return reasons[:3]
```

3. **Feature labels** — Human-readable names for each feature:

```python
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
```

4. **Thresholds computation** — At app startup, compute from `Bank_Loan.csv`:

```python
import pandas as pd

def compute_thresholds(csv_path: str) -> dict:
    df = pd.read_csv(csv_path)
    approved = df[df["Loan_Status"] == "Y"]
    
    return {
        "Cibil_Score": {"median": int(approved["Cibil_Score"].median()), "min": int(approved["Cibil_Score"].quantile(0.25))},
        "ApplicantIncome": {"median": int(approved["ApplicantIncome"].median()), "min": int(approved["ApplicantIncome"].quantile(0.25))},
        "LoanAmount": {"median": int(approved["LoanAmount"].median()), "max": int(approved["LoanAmount"].quantile(0.75))},
        # ... etc for all features
    }
```

### CORS Configuration

Allow `http://localhost:3000` (dev) and `https://*.vercel.app` (prod).

### Environment Variables (Render)

```
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Database Schema (Neon DB)

```sql
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  inputs JSONB NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_predictions_created_at ON predictions(created_at);
```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://bank-loan-prediction-vlx3.onrender.com
```

### Backend (Render)
```
DATABASE_URL=postgresql://...
FLASK_ENV=production
```

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 768px | Single column, full-width cards, stacked form fields |
| Tablet | 768-1024px | Centered layout, 2-column form fields where appropriate |
| Desktop | > 1024px | Max-w-2xl centered, generous whitespace |

## Loading States

1. **Stats bar on mount:** Skeleton placeholder (pulsing gray bar)
2. **Prediction submission:** Button shows spinner, form disabled
3. **Feature bars on scroll:** Animate width from 0 to final value

## Accessibility

- All form fields have associated `<label>` elements
- Focus visible rings on all interactive elements (blue-500 ring)
- ARIA labels on icons (checkmark, X)
- Color is not the only indicator (icons accompany green/red)
- Keyboard navigable through form steps
- `prefers-reduced-motion`: disable bar animations, instant transitions

## Deployment

### Frontend (Vercel)
1. Push `frontend/` to a separate branch or keep in repo root
2. Connect GitHub repo to Vercel
3. Set root directory to `frontend/`
4. Set env var: `NEXT_PUBLIC_API_URL`
5. Auto-deploys on push

### Backend (Render)
- Existing Render service, add `DATABASE_URL` env var
- Add new dependencies to `requirements.txt`
- Auto-deploys on push to master

## File Creation Order

### Phase 0: Model Improvements
0. `BankLoanPredictionV2.ipynb` — New notebook with model improvements (feature engineering, SMOTE, model comparison, cross-validation, calibration)
1. `build_v2.pkl` — Improved model file

### Phase 1: Backend Updates
2. `app.py` — Add /api/predict (with rejection reasons), /api/stats, CORS, load build_v2.pkl, compute thresholds from CSV
3. `requirements.txt` — Add flask-cors, psycopg2-binary, xgboost

### Phase 2: Frontend (Next.js)
4. `frontend/package.json` — dependencies
5. `frontend/next.config.ts` — Next.js config
6. `frontend/tailwind.config.ts` — Tailwind config
7. `frontend/app/globals.css` — Global styles + Tailwind
8. `frontend/app/layout.tsx` — Root layout
9. `frontend/lib/utils.ts` — cn() helper
10. `frontend/components/ui/*` — shadcn/ui components (button, input, select, card, label)
11. `frontend/components/Hero.tsx` — Hero section
12. `frontend/components/StatsBar.tsx` — Stats display
13. `frontend/components/StepPersonal.tsx` — Step 1
14. `frontend/components/StepFinancial.tsx` — Step 2
15. `frontend/components/StepContext.tsx` — Step 3
16. `frontend/components/PredictionResult.tsx` — Result card with rejection reasons
17. `frontend/components/LoanCalculator.tsx` — Multi-step container
18. `frontend/components/FeatureImportance.tsx` — Feature bars
19. `frontend/components/Footer.tsx` — Footer
20. `frontend/lib/api.ts` — API client (handles rejection_reasons)
21. `frontend/app/page.tsx` — Main page
