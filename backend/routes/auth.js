import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import passport from "passport";
import { OIDCStrategy } from "passport-azure-ad";

dotenv.config();
const router = express.Router();

const USERS = [
    { email: "admin@querytel.com", password: "QueryTel@123" },
    { email: "security@querytel.com", password: "SOC@12345" },
];

const JWT_SECRET = process.env.JWT_SECRET || "supersecret-querytel-key";

// ------------------------------
// LOCAL LOGIN (Existing Logic)
// ------------------------------
router.post("/login", (req, res) => {
    const { email, password } = req.body;
    const user = USERS.find((u) => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ token });
});

// ------------------------------
// MICROSOFT AZURE SSO LOGIN
// ------------------------------
const azureConfig = {
    identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    responseType: "code",
    responseMode: "query",
    redirectUrl: process.env.AZURE_REDIRECT_URI || "https://sentinel.itcold.com/auth/azure/callback",
    scope: ["openid", "profile", "email"],
    passReqToCallback: false,
};

passport.use(
    new OIDCStrategy(azureConfig, (iss, sub, profile, accessToken, refreshToken, done) => {
        if (!profile._json.email.endsWith("@querytel.com")) {
            return done(null, false, { message: "Unauthorized domain" });
        }
        return done(null, profile);
    })
);

router.get("/azure/login", passport.authenticate("azuread-openidconnect"));

router.get(
    "/azure/callback",
    passport.authenticate("azuread-openidconnect", { failureRedirect: "/login-failed" }),
    (req, res) => {
        // Create a JWT for the authenticated Microsoft user
        const email = req.user?._json?.email || "unknown@querytel.com";
        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "8h" });
        // Redirect back to your frontend with the token as a query param
        res.redirect(`https://sentinel.itcold.com/login-success?token=${token}`);
    }
);

// ------------------------------
// TOKEN VERIFICATION MIDDLEWARE
// ------------------------------
export function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        req.user = decoded;
        next();
    });
}

export default router;
