import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, todos, oauth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Todo API", version="1.0.0")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
allow_origins = [frontend_url, "http://localhost:5174", "http://localhost:5175"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(todos.router)
app.include_router(oauth.router)


@app.get("/")
def root():
    return {"message": "Todo API is running"}
