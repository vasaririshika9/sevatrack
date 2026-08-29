import sqlite3
from typing import Dict, Any, List, Optional

DB_FILE = "sevatrack.db"

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        status_type TEXT NOT NULL, -- 'pending', 'action', 'approved'
        simple_summary TEXT NOT NULL,
        detailed_explanation TEXT NOT NULL,
        action_required INTEGER NOT NULL, -- 0 or 1
        issue_title TEXT,
        issue_details TEXT,
        action_instruction TEXT,
        deadline TEXT,
        timeline_step INTEGER NOT NULL -- 1 to 5
    )
    """)
    
    # Populate initial synthetic data if table is empty
    cursor.execute("SELECT COUNT(*) FROM applications")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
        INSERT INTO applications (app_code, title, status, status_type, simple_summary, detailed_explanation, action_required, issue_title, issue_details, action_instruction, deadline, timeline_step)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            (
                "APP-INC-2026-1042",
                "Income Certificate",
                "Under Verification",
                "pending",
                "The office is checking your uploaded income proof documents.",
                "Your application has passed initial screening and is currently being verified by the local revenue authority. All submitted documents appear valid.",
                0,
                None,
                None,
                None,
                None,
                3
            ),
            (
                "APP-RES-2026-8821",
                "Residence Certificate",
                "Action Required",
                "action",
                "Your uploaded address proof is unclear or invalid.",
                "The verification officer flagged your electricity bill upload because the address text is blurred and does not clearly match your applicant name.",
                1,
                "Residence Proof Needs Correction",
                "The submitted document image is blurry and missing the consumer name matching your application.",
                "Please upload a clear PDF or photo of a recent electricity bill, voter ID, or gas receipt issued in your name within the last 3 months.",
                "March 15, 2026",
                3
            ),
            (
                "APP-CST-2026-5019",
                "Caste Certificate",
                "Approved",
                "approved",
                "Your application has been verified and your certificate is ready.",
                "All verification checks have successfully passed. Your digital certificate has been generated and digitally signed.",
                0,
                None,
                None,
                None,
                None,
                5
            )
        ])
    conn.commit()
    conn.close()

def get_all_applications() -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_application_by_id(app_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_application_status(app_id: int, status: str, status_type: str, action_required: int, timeline_step: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE applications 
        SET status = ?, status_type = ?, action_required = ?, timeline_step = ?
        WHERE id = ?
    """, (status, status_type, action_required, timeline_step, app_id))
    conn.commit()
    conn.close()