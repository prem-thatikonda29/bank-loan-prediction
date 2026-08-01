import os

bind = f"0.0.0.0:{os.environ.get('PORT', '9000')}"
workers = int(os.environ.get("WORKERS", "2"))
worker_class = "sync"
timeout = 120
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
