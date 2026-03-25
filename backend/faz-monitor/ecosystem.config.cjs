module.exports = {
    apps: [
        {
            name: "querytel-backend",
            script: "server.js",
            cwd: "/home/owais/querytel-soc/backend/faz-monitor",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            merge_logs: true,
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            env: {
                NODE_ENV: "production",
                PORT: 3320
            }
        },
        {
            name: "ai-summary-service",
            script: "ai-summary-service.py",
            interpreter: "python3",
            cwd: "/home/owais/querytel-soc/backend/faz-monitor",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "500M",
            merge_logs: true,
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            env: {
                PYTHONUNBUFFERED: "1",
                OLLAMA_MODEL: "llama3.2:latest"
            }
        },
        {
            name: "faz-ingest",
            script: "ingest-faz.cjs",
            cwd: "/home/owais/querytel-soc/backend/faz-monitor",
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};
