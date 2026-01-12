// backend/faz-monitor/lib/zohoDesk.js
import axios from "axios";
import "dotenv/config";

async function refreshToken() {
  try {
    const res = await axios.post("https://accounts.zoho.com/oauth/v2/token", null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token",
      },
    });

    const accessToken = res.data.access_token;
    process.env.ZOHO_ACCESS_TOKEN = accessToken;
    console.log("✅ Refreshed Zoho access token");
    return accessToken;
  } catch (err) {
    console.error("❌ Failed to refresh Zoho token:", err.response?.data || err.message);
    throw err;
  }
}

async function getToken() {
  if (!process.env.ZOHO_ACCESS_TOKEN) {
    return await refreshToken();
  }
  return process.env.ZOHO_ACCESS_TOKEN;
}

// 🚨 Create new ticket (with placeholder for AI summary)
export async function raiseAlertTicket(logDoc) {
  try {
    let accessToken = await getToken();

    const payload = {
      subject: `SOC Alert: ${logDoc.event?.severity?.toUpperCase()} detected`,
      departmentId: process.env.ZOHO_DEPT_ID,
      contact: {
        lastName: "SOC Monitor",
        email: "support@querytel.com",
      },
      description: `
        <h2>🚨 Security Alert</h2>
        <p><b>Severity:</b> ${logDoc.event?.severity}</p>
        <p><b>Message:</b> ${logDoc.event?.message}</p>
        <p><b>Source:</b> ${logDoc.parsed?.srcip || "N/A"}</p>
        <p><b>Destination:</b> ${logDoc.parsed?.dstip || "N/A"}</p>
        <br/>
        <h3>🔎 AI Classification</h3>
        <p>⏳ Pending AI summary...</p>
      `,
      priority:
        (logDoc.event?.severity || "").toLowerCase() === "error"
          ? "High"
          : "Medium",
    };

    const response = await axios.post(
      `${process.env.ZOHO_BASE}/tickets`,
      payload,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          orgId: process.env.ZOHO_ORG_ID,
          "Content-Type": "application/json",
        },
      }
    );

    const ticket = response.data;
    console.log("✅ Ticket created:", ticket.ticketNumber);

    return ticket;
  } catch (err) {
    if (err.response?.status === 401) {
      console.warn("⚠️ Token invalid, refreshing...");
      await refreshToken();
      return raiseAlertTicket(logDoc);
    }
    console.error("❌ Zoho ticket error:", err.response?.data || err.message);
    throw err;
  }
}

// 🚨 Update ticket with AI summary (adds a note)
export async function updateTicketWithAISummary(ticketId, summary) {
  try {
    let accessToken = await getToken();

    const notePayload = {
      isPublic: true,
      content: `
        <h3>🔎 AI Classification</h3>
        <p>${summary}</p>
      `,
    };

    await axios.post(
      `${process.env.ZOHO_BASE}/tickets/${ticketId}/notes`,
      notePayload,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          orgId: process.env.ZOHO_ORG_ID,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ AI summary added to ticket ${ticketId}`);
  } catch (err) {
    console.error("❌ Failed to update ticket with AI summary:", err.response?.data || err.message);
  }
}
