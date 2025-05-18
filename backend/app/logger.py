import logging
from logging.handlers import RotatingFileHandler
import os

# Make sure the logs directory exists
os.makedirs("logs", exist_ok=True)

# Create the logger
logger = logging.getLogger("geo-message")
logger.setLevel(logging.DEBUG)  # Capture all levels

# Formatter for log lines
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")

# 1️⃣ File handler (writes logs to file with rotation)
file_handler = RotatingFileHandler("logs/app.log", maxBytes=5_000_000, backupCount=3)
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(formatter)

# 2️⃣ Console handler (prints to terminal)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(formatter)

# 3️⃣ Add both handlers (if not already added)
if not logger.handlers:
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)