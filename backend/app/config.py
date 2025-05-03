from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Read values from environment
DATABASE_URL = os.getenv("DATABASE_URL")
DEBUG = os.getenv("DEBUG", "False") == "True"