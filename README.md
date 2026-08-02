# Bank Loan Prediction

ML-powered loan approval predictor with a modern web interface. A Decision Tree classifier trained on financial data predicts whether a loan application will be approved or rejected, with rejection reasons explained.

## Live Demo

- **Frontend:** [bank-loan-prediction-beta.vercel.app](https://bank-loan-prediction-beta.vercel.app/)
- **Backend API:** [bank-loan-prediction-vlx3.onrender.com](https://bank-loan-prediction-vlx3.onrender.com/)

## Features

- **Multi-step form** — 3-step wizard (Personal → Financial → Context) with validation
- **Rejection reasons** — Top 3 factors that affected a rejected decision, explained in plain English
- **Feature importance** — Visual breakdown of what the model considers most important
- **Prediction stats** — Live aggregate counts from Neon DB
- **Improved model** — Feature engineering, class weight balancing, 5-fold cross-validation (92.4% accuracy)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, motion/react |
| Backend | Flask 3.1.3, scikit-learn 1.9.0, XGBoost 3.0.0 |
| Database | Neon DB (PostgreSQL) |
| Deployment | Vercel (frontend), Render (backend) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/predict` | Predict loan approval (JSON in/out) |
| `GET` | `/api/stats` | Get prediction statistics |
| `GET` | `/health` | Health check |
| `GET` | `/` | Legacy HTML form |

### Example Request

```bash
curl -X POST https://bank-loan-prediction-vlx3.onrender.com/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Age": 35, "Dependents": 2, "Gender": 1, "Married": 1,
    "Education": 1, "Self_Employed": 0, "ApplicantIncome": 600000,
    "LoanAmount": 500000, "Cibil_Score": 750, "Tenure": 60,
    "Previous_Loan_Taken": 0, "Property_Area": 2, "Customer_Bandwith": 1
  }'
```

## Model

The V2 model uses:
- **Feature engineering** — `Income_Loan_Ratio`, `Loan_Burden`, `Income_Per_Dependent` (16 features total)
- **Class weight balancing** — `class_weight='balanced'` to handle 72/28 class imbalance
- **Algorithm** — Decision Tree with cross-validation
- **5-fold stratified CV** — Mean F1: 0.848 (+/- 0.028)

See `BankLoanPredictionV2.ipynb` for the full training pipeline.

## Local Development

### Backend

```bash
pip install -r requirements.txt
python app.py
# Runs at http://localhost:9000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:9000` in `frontend/.env.local`.

## Deployment

### Render (Backend)

1. Connect GitHub repo
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `gunicorn -c gunicorn.conf.py app:app`
4. Add env var: `DATABASE_URL` = Neon connection string

### Vercel (Frontend)

1. Import repo, set root directory to `frontend/`
2. Add env var: `NEXT_PUBLIC_API_URL` = `https://bank-loan-prediction-vlx3.onrender.com`
3. Deploy

### Neon DB

```sql
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  result VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```
