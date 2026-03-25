#!/bin/bash

# QueryTel SOC - AI Summary Service Quick Start Script

echo "🚀 Starting QueryTel AI Investigation Summary Service..."
echo ""

# Check if Python dependencies are installed
echo "📦 Checking dependencies..."
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "⚠️  Installing Python dependencies..."
    pip3 install -r ai-requirements.txt
fi

echo "✅ Dependencies OK"
echo ""

# Start AI service
echo "🤖 Starting AI Summary Service on http://127.0.0.1:8000"
python3 ai-summary-service.py
