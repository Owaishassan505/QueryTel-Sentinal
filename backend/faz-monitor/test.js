import "dotenv/config";
import { fetchRecentHighEvents } from "./lib/fazClient.js";

const since = Math.floor(Date.now() / 1000) - 3600; // last 1 hour

fetchRecentHighEvents(process.env.FAZ_ADOM, since, 5)
    .then(events => {
        console.log("Got events:", events);
    })
    .catch(err => {
        console.error("Error:", err);
    });
