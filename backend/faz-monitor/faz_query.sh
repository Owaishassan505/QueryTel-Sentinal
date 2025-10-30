#!/bin/bash

# FortiAnalyzer API details
FAZ_IP="10.180.80.50"
FAZ_PORT="441"
FAZ_USER="querytel-monitor"
FAZ_PASS="Qu3ry1e80!"
FAZ_ADOM="root"

# Step 1: Login and capture session
SESSION=$(curl -sk -H "Content-Type: application/json" \
-X POST "https://${FAZ_IP}:${FAZ_PORT}/jsonrpc" \
-d "{
  \"id\":1,
  \"jsonrpc\":\"2.0\",
  \"method\":\"exec\",
  \"params\":[{
    \"url\":\"/sys/login/user\",
    \"data\":{
      \"user\":\"${FAZ_USER}\",
      \"passwd\":\"${FAZ_PASS}\"
    }
  }]
}" | jq -r '.session')

echo "[+] Session token: $SESSION"

# Step 2: Start query (get qid)
QID=$(curl -sk -H "Content-Type: application/json" \
-X POST "https://${FAZ_IP}:${FAZ_PORT}/jsonrpc" \
-d "{
  \"id\":2,
  \"jsonrpc\":\"2.0\",
  \"method\":\"exec\",
  \"params\":[{
    \"url\":\"logview:adom\",
    \"apiver\":3,
    \"adom\":\"${FAZ_ADOM}\",
    \"query\":{
      \"logtype\":\"event\",
      \"time-range\": { \"start\": 0, \"end\": 0 },
      \"filter\":[[\"severity\",\"in\",[\"high\",\"critical\"]]],
      \"device\":[\"FGT81ETK18006150\"],
      \"limit\":5
    }
  }],
  \"session\":\"${SESSION}\"
}" | jq -r '.result[0].qid')


echo "[+] Query ID: $QID"

# Step 3: Fetch query results
RESULT=$(curl -sk -H "Content-Type: application/json" \
-X POST "https://${FAZ_IP}:${FAZ_PORT}/jsonrpc" \
-d "{
  \"id\":3,
  \"jsonrpc\":\"2.0\",
  \"method\":\"get\",
  \"params\":[{
    \"url\":\"logview:query/${QID}\"
  }],
  \"session\":\"${SESSION}\"
}")

echo "[+] Results:"
echo "$RESULT" | jq .

# Step 4: Logout to close session
curl -sk -H "Content-Type: application/json" \
-X POST "https://${FAZ_IP}:${FAZ_PORT}/jsonrpc" \
-d "{
  \"id\":4,
  \"jsonrpc\":\"2.0\",
  \"method\":\"exec\",
  \"params\":[{
    \"url\":\"/sys/logout\"
  }],
  \"session\":\"${SESSION}\"
}" > /dev/null

echo "[+] Logged out."
