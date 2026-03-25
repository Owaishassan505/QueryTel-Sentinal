#!/bin/bash

# QueryTel SOC - Ollama Installation & Setup Script
# This script installs Ollama and downloads Llama for local AI inference

echo "🚀 QueryTel SOC - Ollama Setup for AI Investigation Summary"
echo "============================================================"
echo ""

# Check if Ollama is already installed
if command -v ollama &> /dev/null; then
    echo "✅ Ollama is already installed"
    ollama --version
else
    echo "📦 Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    
    if [ $? -eq 0 ]; then
        echo "✅ Ollama installed successfully"
    else
        echo "❌ Ollama installation failed"
        exit 1
    fi
fi

echo ""
echo "🔍 Checking if Ollama service is running..."

# Check if Ollama is running
if pgrep -x "ollama" > /dev/null; then
    echo "✅ Ollama service is running"
else
    echo "🚀 Starting Ollama service..."
    ollama serve &
    sleep 5
fi

echo ""
echo "🧠 Downloading Llama 3.2 Model..."
echo "   (This is the brain of the AI - it may take a few minutes)"
echo ""

# Pull Llama 3.2
ollama pull llama3.2

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Llama model downloaded successfully!"
else
    echo ""
    echo "⚠️ Model download failed. Trying alternative 'llama2'..."
    ollama pull llama2
fi

echo ""
echo "🔄 Restarting SOC AI Service..."
if command -v pm2 &> /dev/null; then
    pm2 restart ai-summary
    echo "✅ Service restarted successfully"
else
    echo "⚠️ PM2 not found. Please restart your python service manually."
fi

echo ""
echo "============================================================"
echo "🎉 REAL AI ENABLED!"
echo "   Go to the Dashboard -> Analysis Tab to see it in action."
echo "============================================================"
