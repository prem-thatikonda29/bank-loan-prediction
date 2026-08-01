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
