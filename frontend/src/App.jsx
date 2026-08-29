import React, { useState, useEffect } from 'react';
import './App.css';

// const API_BASE = "http://localhost:8000/api";
// const API_BASE = "https://sevatrack-backend-2nfn.onrender.com";
const API_BASE = "https://sevatrack-backend-2nfn.onrender.com/api";


export default function App() {
  const [page, setPage] = useState('landing'); // landing, login, dashboard, details, fix, approved
  const [token, setToken] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Form states
  const [email, setEmail] = useState('demo@sevatrack.in');
  const [password, setPassword] = useState('123456');
  const [userQuestion, setUserQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch all applications
  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/applications`);
      if (!res.ok) throw new Error("Failed to connect to backend service.");
      const data = await res.json();
      setApplications(data);
    } catch (err) {
      setError(err.message || "Something went wrong loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      
      setToken(data.token);
      setPage('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAppDetails = async (appId) => {
    setLoading(true);
    setError('');
    setAiAnswer('');
    setUserQuestion('');
    try {
      const res = await fetch(`${API_BASE}/applications/${appId}`);
      if (!res.ok) throw new Error("Could not load application details.");
      const data = await res.json();
      setSelectedApp(data);
      
      if (data.status_type === 'approved') {
        setPage('approved');
      } else {
        setPage('details');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = async (question = null) => {
    if (!selectedApp) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: selectedApp.id, question: question || userQuestion })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "AI explanation failed.");
      setAiAnswer(data.answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFixSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/applications/${selectedApp.id}/fix`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Submission failed.");
      
      setSuccessMsg("Document submitted successfully! Status updated to Under Verification.");
      await loadApplications();
      
      // Refresh current app view
      const updatedRes = await fetch(`${API_BASE}/applications/${selectedApp.id}`);
      const updatedData = await updatedRes.json();
      setSelectedApp(updatedData);
      
      setTimeout(() => {
        setPage('details');
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="logo" onClick={() => setPage('landing')}>
          <span>🇮🇳</span> SevaTrack
        </div>
        <div className="nav-links">
          {token ? (
            <button onClick={() => setPage('dashboard')}>My Applications</button>
          ) : (
            <button onClick={() => setPage('login')}>Login</button>
          )}
        </div>
      </nav>

      <div className="container">
        {/* Global Error Notice */}
        {error && <div className="error-msg">{error}</div>}
        {successMsg && <div style={{ background: '#dcfce7', color: '#15803d', padding: 12, borderRadius: 6, margin: '10px 0' }}>{successMsg}</div>}

        {/* 1. LANDING PAGE */}
        {page === 'landing' && (
          <div>
            <div className="banner-disclaimer">
              ℹ️ <strong>Hackathon Prototype:</strong> SevaTrack is an independent educational application utilizing synthetic demonstration data. It does not access real government systems or personal identifiers.
            </div>
            
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: 12 }}>Government applications, explained simply.</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: 24 }}>
                No complex jargon. Track your official applications, understand exact status details, and know precisely what steps to take next.
              </p>
              <button className="btn" style={{ maxWidth: 280 }} onClick={() => setPage('login')}>
                Try Demo
              </button>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: 16 }}>How SevaTrack Helps You</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                  <h3>1. Track</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>View real-time updates for all your certificates in one clear mobile view.</p>
                </div>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                  <h3>2. Understand</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>AI translates bureaucratic notes like "Deficient Document" into simple English.</p>
                </div>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                  <h3>3. Act</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Get direct instructions and one-click actions when a document correction is needed.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. LOGIN PAGE */}
        {page === 'login' && (
          <div className="card" style={{ maxWidth: 450, margin: '40px auto' }}>
            <h2 style={{ marginBottom: 8 }}>Citizen Login</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
              Use the demo credentials below to access test applications.
            </p>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: 12, borderRadius: 6, fontSize: '0.85rem', marginBottom: 20 }}>
              <strong>Demo Credentials:</strong><br/>
              Email: <code>demo@sevatrack.in</code><br/>
              Password: <code>123456</code>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className={`btn ${loading ? 'loading' : ''}`}>
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>
          </div>
        )}

        {/* 3. DASHBOARD */}
        {page === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 10px 0' }}>
              <h2>Your Applications</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Showing 3 Demo Records</span>
            </div>

            {applications.map((app) => (
              <div key={app.id} className="card" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem' }}>{app.title}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {app.app_code}</span>
                  </div>
                  <span className={`badge badge-${app.status_type}`}>
                    {app.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.95rem', color: '#334155', margin: '12px 0' }}>
                  {app.simple_summary}
                </p>

                <button 
                  className="btn btn-secondary" 
                  onClick={() => openAppDetails(app.id)}
                >
                  View Application
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 4. APPLICATION DETAILS & 5. AI EXPLANATION */}
        {page === 'details' && selectedApp && (
          <div>
            <button className="btn btn-secondary" style={{ width: 'auto', marginBottom: 16 }} onClick={() => setPage('dashboard')}>
              ← Back to Dashboard
            </button>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>{selectedApp.title}</h2>
                <span className={`badge badge-${selectedApp.status_type}`}>{selectedApp.status}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Application Ref: {selectedApp.app_code}
              </p>

              {/* Status Timeline */}
              <div className="timeline">
                <div className={`timeline-step ${selectedApp.timeline_step >= 1 ? 'completed' : ''}`}>
                  <div className="dot"></div>
                  Submitted
                </div>
                <div className={`timeline-step ${selectedApp.timeline_step >= 2 ? 'completed' : ''}`}>
                  <div className="dot"></div>
                  Received
                </div>
                <div className={`timeline-step ${selectedApp.timeline_step === 3 ? 'active' : selectedApp.timeline_step > 3 ? 'completed' : ''}`}>
                  <div className="dot"></div>
                  Verification
                </div>
                <div className={`timeline-step ${selectedApp.timeline_step >= 4 ? 'completed' : ''}`}>
                  <div className="dot"></div>
                  Approval
                </div>
                <div className={`timeline-step ${selectedApp.timeline_step >= 5 ? 'completed' : ''}`}>
                  <div className="dot"></div>
                  Issued
                </div>
              </div>

              {/* 6. Action Required Banner */}
              {selectedApp.action_required === 1 && (
                <div className="banner-action">
                  <h3 style={{ color: 'var(--warning)', marginBottom: 4 }}>⚠️ Something needs your attention</h3>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedApp.issue_title}</p>
                  <p style={{ fontSize: '0.9rem', margin: '6px 0 12px 0' }}>{selectedApp.issue_details}</p>
                  <p style={{ fontSize: '0.85rem', color: '#9a3412', marginBottom: 12 }}>
                    <strong>Action Needed:</strong> {selectedApp.action_instruction}<br/>
                    <strong>Deadline:</strong> {selectedApp.deadline}
                  </p>
                  <button className="btn btn-warning" onClick={() => setPage('fix')}>
                    Fix Application Now
                  </button>
                </div>
              )}

              {/* Status Breakdown Questions */}
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginTop: 16 }}>
                <h4 style={{ marginBottom: 8 }}>Status Breakdown</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: 6 }}>
                  <strong>1. What happened?</strong> {selectedApp.status}
                </p>
                <p style={{ fontSize: '0.9rem', marginBottom: 6 }}>
                  <strong>2. What does it mean?</strong> {selectedApp.simple_summary}
                </p>
                <p style={{ fontSize: '0.9rem' }}>
                  <strong>3. What should I do next?</strong> {selectedApp.action_required ? 'Upload corrected document as noted above.' : 'No action required right now. Check back later.'}
                </p>
              </div>

              {/* AI Explanation Box */}
              <div className="ai-box">
                <h3 style={{ color: '#0369a1', fontSize: '1.05rem', marginBottom: 8 }}>🤖 SevaTrack AI Assistant</h3>
                <p style={{ fontSize: '0.85rem', color: '#0284c7', marginBottom: 12 }}>
                  Ask questions in plain language regarding this application status.
                </p>

                <button 
                  className="btn btn-secondary" 
                  style={{ marginTop: 0, marginBottom: 12 }} 
                  onClick={() => handleAskAI()}
                >
                  ✨ Explain this status simply
                </button>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 4 }} onClick={() => handleAskAI("Why is my application pending?")}>
                    Why is my application pending?
                  </button>
                  <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 4 }} onClick={() => handleAskAI("Do I need to visit an office?")}>
                    Do I need to visit an office?
                  </button>
                  <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 4 }} onClick={() => handleAskAI("What happens next?")}>
                    What happens next?
                  </button>
                </div>

                <div className="form-group" style={{ marginBottom: 8 }}>
                  <input 
                    type="text" 
                    placeholder="Ask another question..." 
                    value={userQuestion} 
                    onChange={(e) => setUserQuestion(e.target.value)} 
                  />
                </div>
                <button 
                  className="btn" 
                  style={{ padding: '8px 12px', fontSize: '0.9rem' }} 
                  onClick={() => handleAskAI()}
                  disabled={loading}
                >
                  {loading ? 'Asking AI...' : 'Ask AI'}
                </button>

                {aiAnswer && (
                  <div className="ai-answer">
                    <strong>AI Response:</strong>
                    <p style={{ marginTop: 4, fontSize: '0.9rem' }}>{aiAnswer}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. FIX APPLICATION */}
        {page === 'fix' && selectedApp && (
          <div>
            <button className="btn btn-secondary" style={{ width: 'auto', marginBottom: 16 }} onClick={() => setPage('details')}>
              ← Back to Application Details
            </button>

            <div className="card">
              <h2>Fix Application Details</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 16px 0' }}>
                Application: {selectedApp.title} ({selectedApp.app_code})
              </p>

              <div style={{ background: '#fef3c7', padding: 12, borderRadius: 6, fontSize: '0.9rem', marginBottom: 16 }}>
                <strong>Issue:</strong> {selectedApp.issue_details}
              </div>

              <form onSubmit={handleFixSubmit}>
                <div className="form-group">
                  <label>Select Document Type</label>
                  <select style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid var(--border)' }}>
                    <option>Electricity Bill (Clear Copy)</option>
                    <option>Voter Identity Card</option>
                    <option>Gas Receipt (Recent)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Upload Document File (Demo)</label>
                  <input type="file" required style={{ padding: 8 }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accepted formats: PDF, JPG, PNG (Max 5MB)</span>
                </div>

                <button type="submit" className={`btn btn-warning ${loading ? 'loading' : ''}`}>
                  {loading ? 'Submitting...' : 'Submit Correction'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 8. APPROVED APPLICATION */}
        {page === 'approved' && selectedApp && (
          <div>
            <button className="btn btn-secondary" style={{ width: 'auto', marginBottom: 16 }} onClick={() => setPage('dashboard')}>
              ← Back to Dashboard
            </button>

            <div className="banner-official-demo">
              DEMO — NOT AN OFFICIAL GOVERNMENT CERTIFICATE
            </div>

            <div className="card" style={{ border: '2px solid var(--success)' }}>
              <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '2.5rem' }}>🏅</span>
                <h2 style={{ color: 'var(--success)', marginTop: 8 }}>Your Certificate is Ready</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Issued under Synthetic Demonstration Data Standards</p>
              </div>

              <div style={{ margin: '20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.9rem' }}>
                <div><strong>Certificate Type:</strong> {selectedApp.title}</div>
                <div><strong>Application Ref:</strong> {selectedApp.app_code}</div>
                <div><strong>Status:</strong> Issued & Verified</div>
                <div><strong>Issue Date:</strong> August 29, 2026</div>
              </div>

              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px dashed #cbd5e1', textAlign: 'center', marginBottom: 20 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Digital Signature Verified • QR Code Validation Mock Active
                </p>
              </div>

              <button className="btn" onClick={() => alert("Demo certificate download initiated (synthetic PDF file).")}>
                Download Demo Certificate (PDF)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}