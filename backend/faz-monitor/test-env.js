import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the same directory
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("AZURE_CLIENT_ID:", process.env.AZURE_CLIENT_ID);
console.log("AZURE_TENANT_ID:", process.env.AZURE_TENANT_ID);
console.log("AZURE_REDIRECT_URI:", process.env.AZURE_REDIRECT_URI);
