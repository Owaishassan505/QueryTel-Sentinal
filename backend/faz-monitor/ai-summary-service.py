#!/usr/bin/env python3
"""
AI Investigation Summary Service - Llama Edition
Uses Ollama to run Llama 3.2 locally for intelligent security log analysis
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import json
from datetime import datetime
from collections import Counter
import uvicorn
import requests
import os
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

app = FastAPI(title="QueryTel AI Summary Service - Llama Edition")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")  # default to 1b for stability

class SummaryRequest(BaseModel):
    text: str  # JSON string of logs

class SummaryResponse(BaseModel):
    summary: str

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []

class Message(BaseModel):
    role: str
    content: str

def check_ollama_available() -> bool:
    """Check if Ollama is running and accessible"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=30)
        return response.status_code == 200
    except:
        return False

def analyze_logs_basic(logs: List[Dict[str, Any]]) -> str:
    """
    Advanced Rule-Based Analysis (Simulated AI) when Ollama is offline.
    Generates a high-fidelity threat report based on statistical patterns.
    """
    if not logs:
        return "📊 **No Recent Activity**\n\nNo security events detected in the monitoring window."
    
    total = len(logs)
    
    # Severity & Stats
    severities = Counter(log.get('severity', 'unknown').lower() for log in logs)
    critical = severities.get('critical', 0)
    errors = severities.get('error', 0)
    warnings = severities.get('warning', 0) + severities.get('warn', 0)
    
    # Category analysis
    categories = Counter(log.get('category', 'Unknown') for log in logs)
    top_categories = categories.most_common(5)
    
    # Device & Source analysis
    try:
        devices = Counter(log.get('deviceName', 'Unknown') for log in logs).most_common(3)
        src_countries = Counter(log.get('srcCountry', 'Unknown') for log in logs if log.get('srcCountry')).most_common(3)
    except Exception:
        devices = []
        src_countries = []
    
    # Narrative Building
    summary_lines = []
    
    # 1. Executive Status
    summary_lines.append("🛡️ **Executive Summary:**")
    summary_lines.append(f"STATUS: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    
    # Threat Scoring
    levels = ["LOW", "MODERATE", "ELEVATED", "CRITICAL"]
    score = min(3, (critical * 2) + (errors // 5) + (warnings // 10))
    summary_lines.append(f"Threat Condition: {levels[score]}")
    
    summary_lines.append(f"Heuristic analysis indicate autonomous monitoring is active with {total} events processed. {critical} critical alerts identify immediate focus areas.")
    summary_lines.append("")
    
    # 2. Key Findings (Pattern Recognition)
    summary_lines.append("**Detected Patterns & Anomalies:**")
    
    # Check for Brute Force (Repeated Auth Failures)
    auth_fails = sum(1 for log in logs if 'login' in log.get('message', '').lower() and 'fail' in log.get('message', '').lower())
    if auth_fails > 5:
         summary_lines.append(f"Auth Failure Spike: Detected {auth_fails} failed login attempts across network nodes.")
    
    # Check for Port Scanning (Multiple connections from same IP)
    src_ips = [log.get('sourceIp') for log in logs if log.get('sourceIp')]
    ip_counts = Counter(src_ips)
    scan_ip = next((ip for ip, count in ip_counts.items() if count > 10), None)
    if scan_ip:
         summary_lines.append(f"Reconnaissance Profile: Source IP {scan_ip} exhibiting high-frequency connection patterns.")
    
    if critical > 0:
         summary_lines.append(f"Critical Severity Trigger: {critical} events matched high-priority threat signatures.")
    
    if not any([auth_fails > 5, scan_ip, critical > 0]):
         summary_lines.append("Baseline Stability: No significant heuristic deviations detected in telemetry.")

    # 3. Category Breakdown
    summary_lines.append("\n**Sector Activity Breakdown:**")
    if top_categories:
        for cat, count in top_categories:
             summary_lines.append(f"{cat}: {count}")
    else:
         summary_lines.append("No categorical data available.")

    # 4. Tactical Recommendations
    summary_lines.append("\n**Strategic Countermeasures:**")
    if critical > 0:
        summary_lines.append("1. Isolate endpoints associated with high-priority signatures.")
        summary_lines.append("2. Initiate deep-packet inspection on anomalous source clusters.")
    elif errors > 0:
        summary_lines.append("1. Audit system logs for service-level degradations.")
        summary_lines.append("2. Broaden ingress filtering for the identified top sectors.")
    else:
        summary_lines.append("1. Sustain standard monitoring protocols.")
        summary_lines.append("2. Perform routine baseline verification.")

    summary_lines.append("\n---")
    summary_lines.append("*Generated by QueryTel Adaptive Heuristics (Fallback Mode)*")
    
    return "\n".join(summary_lines)

def analyze_logs_with_llama(logs: List[Dict[str, Any]]) -> str:
    """
    Advanced AI analysis using Llama via Ollama
    """
    if not logs:
        return "📊 **No Recent Activity**\n\nNo security events detected in the monitoring window."
    
    # Prepare log statistics for Llama
    total = len(logs)
    severities = Counter(log.get('severity', 'unknown').lower() for log in logs)
    categories = Counter(log.get('category', 'Unknown') for log in logs)
    src_countries = Counter(log.get('srcCountry', 'Unknown') for log in logs if log.get('srcCountry'))
    devices = Counter(log.get('deviceName', 'Unknown') for log in logs)
    
    # Get sample of recent critical/error events
    critical_logs = [log for log in logs[:50] if log.get('severity', '').lower() in ['critical', 'error']]
    
    # Build context for Llama
    context = f"""You are a cybersecurity analyst AI assistant analyzing security logs from a SOC (Security Operations Center).

**Log Statistics:**
- Total Events: {total}
- Critical: {severities.get('critical', 0)}
- Errors: {severities.get('error', 0)}
- Warnings: {severities.get('warning', 0) + severities.get('warn', 0)}

**Top Categories:**
{chr(10).join([f"- {cat}: {count}" for cat, count in categories.most_common(5)])}

**Top Source Countries:**
{chr(10).join([f"- {country}: {count}" for country, count in src_countries.most_common(5)])}

**Monitored Devices:** {len(devices)}

**Recent Critical Events (sample):**
{chr(10).join([f"- {log.get('category', 'Unknown')}: {log.get('message', 'N/A')[:100]}" for log in critical_logs[:5]])}

**Task:** Provide a concise, professional threat intelligence summary for SOC analysts.
You MUST format your response exactly with these section headers:
**Executive Summary:** (Begin with "STATUS: YYYY-MM-DD HH:MM:SS UTC" and "Threat Condition: CRITICAL/ELEVATED/STABLE")
**Detected Patterns & Anomalies:** (List specific patterns found, e.g., "Pattern Name: Description")
**Sector Activity Breakdown:** (List top categories and their counts, e.g., "Category: Count")
**Strategic Countermeasures:** (List 2-3 actionable steps)

Keep the response under 300 words and use a professional, technical tone suitable for security professionals. Do not use markdown other than the headers.
"""

    try:
        # Call Ollama API
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": context,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "top_p": 0.9,
                    "num_predict": 500,
                    "num_thread": 4
                }
            },
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            llama_summary = result.get('response', '').strip()
            
            # Format the response
            formatted_summary = f"""🤖 **AI-Powered Threat Intelligence Summary (Llama {OLLAMA_MODEL})**
*Analysis Period: Last {total} Events*

{llama_summary}

---
*Generated by Llama AI • QueryTel SOC Intelligence*"""
            
            return formatted_summary
        else:
            print(f"⚠️ Ollama API error: {response.status_code}")
            return analyze_logs_basic(logs)
            
    except requests.exceptions.Timeout:
        print("⚠️ Ollama request timeout - using fallback")
        return analyze_logs_basic(logs)
    except Exception as e:
        print(f"⚠️ Llama analysis error: {str(e)} - using fallback")
        return analyze_logs_basic(logs)

@app.post("/summary", response_model=SummaryResponse)
async def generate_summary(request: SummaryRequest):
    """
    Generate AI summary from log data using Llama
    """
    try:
        # Parse the JSON string
        logs = json.loads(request.text)
        
        if not isinstance(logs, list):
            raise ValueError("Expected a list of log objects")
        
        # Check if Ollama is available
        if check_ollama_available():
            print(f"✅ Using Llama AI ({OLLAMA_MODEL}) for analysis")
            summary = analyze_logs_with_llama(logs)
        else:
            print("⚠️ Ollama not available - using rule-based analysis")
            summary = analyze_logs_basic(logs)
        
        return SummaryResponse(summary=summary)
    
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/chat")
async def chat_with_ai(request: ChatRequest):
    """
    Chat directly with the AI
    """
    if not check_ollama_available():
        return {"response": "I'm currently in offline mode. Please ensure Ollama is running and Llama model is pulled to enable full AI chat capabilities."}
    
    try:
        # Build prompt from history
        system_msg = "You are QueryTel Copilot, a premium cybersecurity AI assistant integrated into the QueryTel Sentinel SOC platform. You help analysts understand threats, explain complex log data, provide tactical recommendations, and assist with SOC operations. Use a professional, expert tone."
        
        messages = [{"role": "system", "content": system_msg}]
        for msg in request.history:
            messages.append(msg)
        messages.append({"role": "user", "content": request.message})
        
        response = requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 1000,
                    "num_thread": 4
                }
            },
            timeout=180
        )
        
        if response.status_code == 200:
            result = response.json()
            return {"response": result.get('message', {}).get('content', '')}
        else:
            return {"response": f"Error from AI engine: {response.status_code}"}
    except Exception as e:
        return {"response": f"Chat failed: {str(e)}"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    ollama_status = "online" if check_ollama_available() else "offline"
    
    return {
        "status": "healthy",
        "service": "AI Summary Service - Llama Edition",
        "version": "2.0.0",
        "ollama_status": ollama_status,
        "ollama_url": OLLAMA_URL,
        "model": OLLAMA_MODEL,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/")
async def root():
    """Root endpoint"""
    ollama_status = "online" if check_ollama_available() else "offline"
    
    return {
        "service": "QueryTel AI Investigation Summary - Llama Edition",
        "status": "online",
        "ai_engine": f"Llama ({OLLAMA_MODEL})",
        "ollama_status": ollama_status,
        "endpoints": {
            "summary": "POST /summary",
            "health": "GET /health"
        }
    }

if __name__ == "__main__":
    print("🤖 Starting AI Summary Service - Llama Edition")
    print(f"📡 Ollama URL: {OLLAMA_URL}")
    print(f"🧠 Model: {OLLAMA_MODEL}")
    
    if check_ollama_available():
        print("✅ Ollama is running and accessible")
    else:
        print("⚠️ Ollama not detected - will use fallback analysis")
        print("   Install Ollama: curl -fsSL https://ollama.com/install.sh | sh")
        print(f"   Then run: ollama pull {OLLAMA_MODEL}")
    
    print("\n🚀 Starting server on http://127.0.0.1:8000\n")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
