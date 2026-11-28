
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize Memora backend

app = FastAPI(
    title="Memora API",
    description="Backend for Memora's memory training platform",
    version="1.0.0"
)

# Allow our React frontend to communicate
# with the backend during development

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint

@app.get("/")
def home():
    return {
        "message": "Welcome to Memora API",
        "version": "1.0.0",
        "status": "online"
    }


# Health check endpoint

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Memora Backend"
    }


# Memory training activities

@app.get("/api/activities")
def get_activities():
    return {
        "activities": [
            {
                "id": "kim",
                "name": "Kim's Game",
                "type": "Visual Memory"
            },
            {
                "id": "leitner",
                "name": "Leitner System",
                "type": "Spaced Repetition"
            },
            {
                "id": "blurting",
                "name": "Blurting Method",
                "type": "Active Recall"
            }
        ]
    }
