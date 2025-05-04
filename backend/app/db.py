from sqlalchemy import create_engine
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        print("✅ Connected to local PostgreSQL database!")
except Exception as e:
    print("❌ Failed to connect:", e)