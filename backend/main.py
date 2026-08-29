# import os
# from fastapi import FastAPI, HTTPException, UploadFile, File
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import Optional
# import openai

# from database import init_db, get_all_applications, get_application_by_id, update_application_status

# app = FastAPI(title="SevaTrack API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
#)
import os
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import openai

from database import init_db, get_all_applications, get_application_by_id, update_application_status

app = FastAPI(title="SevaTrack API")

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5176",   # Vite dev server
        "https://sevatrack-frontend.onrender.com",  # example deployed frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()

class LoginRequest(BaseModel):
    email: str
    password: str

class AIQuestionRequest(BaseModel):
    app_id: int
    question: Optional[str] = None

@app.post("/api/login")
def login(credentials: LoginRequest):
    if credentials.email == "demo@sevatrack.in" and credentials.password == "123456":
        return {"status": "success", "token": "mock-jwt-token-12345", "user": {"email": credentials.email, "name": "Demo Citizen"}}
    raise HTTPException(status_code=401, detail="Invalid credentials. Use demo@sevatrack.in / 123456")

@app.get("/api/applications")
def list_applications():
    return get_all_applications()

@app.get("/api/applications/{app_id}")
def get_application(app_id: int):
    app_data = get_application_by_id(app_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_data

@app.post("/api/applications/{app_id}/fix")
async def fix_application(app_id: int, file: Optional[UploadFile] = File(None)):
    app_data = get_application_by_id(app_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_application_status(
        app_id=app_id,
        status="Under Verification",
        status_type="pending",
        action_required=0,
        timeline_step=3
    )
    return {"status": "success", "message": "Correction submitted successfully. Status updated to Under Verification."}

@app.post("/api/explain")
def explain_status(payload: AIQuestionRequest):
    app_data = get_application_by_id(payload.app_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Application not found")

    api_key = os.getenv("OPENAI_API_KEY")
    
    # Fallback response if no OpenAI key is configured
    if not api_key:
        if payload.question:
            return {
                "answer": f"[Offline AI Demo] Regarding '{payload.question}': Based on your {app_data['title']} status ('{app_data['status']}'), {app_data['simple_summary']} No office visit is required unless specifically requested online."
            }
        return {
            "answer": f"[Offline AI Demo] Your application for {app_data['title']} is currently '{app_data['status']}'. {app_data['detailed_explanation']}"
        }

    client = openai.OpenAI(api_key=api_key)
    
    system_prompt = (
        "You are SevaTrack AI, a helpful assistant explaining Indian government service application statuses in plain, simple, friendly English. "
        "Strict Rule: Use ONLY the provided application context data. Do NOT invent real government departments, acts, rules, or unmentioned facts. "
        "Always structure your answer clearly addressing: 1. What happened, 2. What it means, 3. What to do next."
    )
    
    user_context = (
        f"Application Title: {app_data['title']}\n"
        f"Application Code: {app_data['app_code']}\n"
        f"Current Status: {app_data['status']}\n"
        f"Summary: {app_data['simple_summary']}\n"
        f"Details: {app_data['detailed_explanation']}\n"
        f"Action Required: {'Yes' if app_data['action_required'] else 'No'}\n"
        f"Issue Details: {app_data.get('issue_details', 'None')}\n"
        f"Action Instructions: {app_data.get('action_instruction', 'None')}\n"
        f"User Query: {payload.question if payload.question else 'Please explain my current application status in simple terms.'}"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_context}
            ],
            temperature=0.3,
            max_tokens=300
        )
        return {"answer": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI service error: {str(e)}")