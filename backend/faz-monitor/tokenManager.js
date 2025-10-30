import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const path = "./zoho_tokens.json";
const {
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN,
    ZOHO_DC = "com",
} = process.env;

function saveTokens(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function loadTokens() {
    if (!fs.existsSync(path)) {
        saveTokens({ refresh_token: ZOHO_REFRESH_TOKEN, created_at: Date.now() });
    }
    return JSON.parse(fs.readFileSync(path));
}

async function refreshAccessToken(refresh_token) {
    const url = `https://accounts.zoho.${ZOHO_DC}/oauth/v2/token`;
    const params = new URLSearchParams({
        refresh_token,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token",
    });
    const { data } = await axios.post(url, params);
    return { access_token: data.access_token, expires_in: data.expires_in };
}

export async function getAccessToken() {
    const tokens = loadTokens();
    const fresh = await refreshAccessToken(tokens.refresh_token);
    const newTokens = { ...tokens, ...fresh, created_at: Date.now() };
    saveTokens(newTokens);
    return fresh.access_token;
}
