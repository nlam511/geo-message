from sqlalchemy import create_engine, text
from app.config import DATABASE_URL
from app.models import Base

engine = create_engine(DATABASE_URL)

def check_connection():
    try:
        with engine.connect() as conn:
            print("✅ Connected to local PostgreSQL database!")
    except Exception as e:
        print("❌ Failed to connect:", e)

def reset_database():
    Base.metadata.drop_all(bind=engine)
    print("🗑️ Dropped all tables.")

    Base.metadata.create_all(bind=engine)
    print("✅ Created tables.")

    # Create Postgis Extension
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            print("🧭 PostGIS extension enabled.")
    except Exception as e:
        print("❌ Failed to enable PostGIS:", e)



if __name__ == "__main__":
    reset_database()
    check_connection()
