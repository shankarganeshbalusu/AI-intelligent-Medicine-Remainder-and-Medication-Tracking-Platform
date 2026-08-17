from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routes import auth, users, medicines, admin
from app import email_worker
import asyncio

# Auto-create SQLite database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PillSync: Medication Reminder and Adherence Platform",
    description="Backend services for PillSync, including user accounts, profile management, and caregiver linking.",
    version="1.0.0"
)

# Configure CORS so our React frontend can consume the APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. Limit this in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(medicines.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(email_worker.check_and_send_reminders())

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "pillsync-backend"}

