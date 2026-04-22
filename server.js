require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));

const server = http.createServer(app);

// -----------------------------
// 🔐 CONFIG
// -----------------------------
const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;

// ✅ Alexa redirect URLs
const allowedRedirects = [
    "https://pitangui.amazon.com/api/skill/link/M3LS5LKSC7M1XU",
    "https://layla.amazon.com/api/skill/link/M3LS5LKSC7M1XU",
    "https://alexa.amazon.com/api/skill/link/M3LS5LKSC7M1XU",
    "https://alexa.amazon.co.jp/api/skill/link/M3LS5LKSC7M1XU"
];

// -----------------------------
// 🧠 MOCK DB
// -----------------------------
const users = [{ id: "1", username: "test", password: "1234" }];
const authCodes = {};

// -----------------------------
// 🔑 AUTHORIZE
// -----------------------------
app.get("/oauth/authorize", (req, res) => {
    const { client_id, redirect_uri, state } = req.query;

    console.log("🔥 AUTHORIZE HIT:", req.query);

    // ✅ Validate client
    if (client_id !== CLIENT_ID) {
        return res.status(400).send("Invalid client_id");
    }

    // ✅ FIXED redirect validation (IMPORTANT)
    const isValidRedirect = allowedRedirects.some(url =>
        redirect_uri.startsWith(url)
    );

    if (!isValidRedirect) {
        console.log("❌ Invalid redirect_uri:", redirect_uri);
        return res.status(400).send("Invalid redirect_uri");
    }

    // ✅ Simulate login
    const user = users[0];

    const code = uuidv4();

    authCodes[code] = {
        userId: user.id,
        redirectUri: redirect_uri
    };

    const redirectUrl = `${redirect_uri}?code=${code}&state=${state}`;

    console.log("➡️ Redirecting to:", redirectUrl);

    res.redirect(redirectUrl);
});

// -----------------------------
// 🔑 TOKEN
// -----------------------------
app.post("/oauth/token", (req, res) => {
    const { grant_type, code, redirect_uri } = req.body;

    console.log("🔥 TOKEN BODY:", req.body);

    // ✅ Extract Basic Auth
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Basic ")) {
        return res.status(400).json({ error: "Missing Authorization header" });
    }

    const base64 = authHeader.split(" ")[1];
    const decoded = Buffer.from(base64, "base64").toString("utf8");

    const [client_id, client_secret] = decoded.split(":");

    console.log("CLIENT_ID:", client_id);
    console.log("CLIENT_SECRET:", client_secret);

    // ✅ Validate client
    if (client_id !== CLIENT_ID) {
        return res.status(400).json({ error: "Invalid client_id" });
    }

    if (client_secret !== CLIENT_SECRET) {
        return res.status(400).json({ error: "Invalid client_secret" });
    }

    if (grant_type !== "authorization_code") {
        return res.status(400).json({ error: "Unsupported grant type" });
    }

    const data = authCodes[code];

    if (!data) {
        return res.status(400).json({ error: "Invalid or expired code" });
    }

    // ✅ FIX: validate redirect_uri
    if (data.redirectUri !== redirect_uri) {
        return res.status(400).json({ error: "redirect_uri mismatch" });
    }

    delete authCodes[code];

    // ✅ Generate token
    const accessToken = jwt.sign(
        { userId: data.userId },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1h" }
    );

    console.log("✅ TOKEN GENERATED");

    return res.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: `refresh_${data.userId}_${code}`
    });
});

// -----------------------------
// 🔒 VERIFY TOKEN
// -----------------------------
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).send("No token");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).send("Invalid token");
    }
}

// -----------------------------
// 📩 ALEXA DIRECTIVES
// -----------------------------
app.post("/integrations/alexa/directives", (req, res) => {
    console.log("📩 Alexa Directive:", JSON.stringify(req.body, null, 2));

    res.json({
        event: {
            header: {
                namespace: "Alexa",
                name: "Response",
                messageId: uuidv4(),
                payloadVersion: "3"
            },
            endpoint: {
                endpointId: "device001"
            },
            payload: {}
        }
    });
});

// -----------------------------
// 📊 STATUS
// -----------------------------
app.get("/voice/integrations/status", verifyToken, (req, res) => {
    res.json({ alexa: true });
});

// -----------------------------
// 🔗 START ALEXA LINKING
// -----------------------------
app.get("/voice/alexa/link/start", (req, res) => {
    const clientId = CLIENT_ID;

    const redirectUri = encodeURIComponent(
        "https://pitangui.amazon.com/api/skill/link/M3LS5LKSC7M1XU"
    );

    const scope = encodeURIComponent("voice:control");

    const alexaAuthUrl = `https://www.amazon.com/ap/oa?client_id=${clientId}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}`;

    console.log("➡️ Redirecting user to Alexa:", alexaAuthUrl);

    res.redirect(alexaAuthUrl);
});

// -----------------------------
// 🚀 START SERVER
// -----------------------------
server.listen(process.env.PORT, () => {
    console.log(`
🚀 Server running on http://localhost:${process.env.PORT}
  `);
});