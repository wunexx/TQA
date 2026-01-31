import express from "express";
import cors from "cors";
import pkg from "pg";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import helmet from "helmet";

const { Pool } = pkg;
const app = express();

const INCREMENT = 0.000026;
const ACCESS_EXPIRE = "5m";
const REFRESH_DAYS = 30;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.set("trust proxy", 1);
app.use(express.json());
app.use(helmet());
app.use(cors({ origin: ["https://wunexx.github.io"] }));
app.use(rateLimit({ windowMs: 10_000, max: 50 }));

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

function signAccessToken(userId, ua) {
  return jwt.sign(
    { userId, ua },
    process.env.JWT_SECRET,
    {
      expiresIn: ACCESS_EXPIRE,
      issuer: "wunex",
      audience: "wunex-client"
    }
  );
}

function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Missing token" });

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "wunex",
      audience: "wunex-client"
    });

    if (payload.ua !== req.headers["user-agent"])
      return res.status(401).json({ error: "Fingerprint mismatch" });

    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

app.post("/api/auth/telegram", async (req, res) => {
  try {
    const user = verifyTelegram(req.body.initData);
    const userId = user.id;

    await pool.query(
      "INSERT INTO users (telegram_id, first_name) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [userId, user.first_name]
    );

    const refreshToken = generateRefreshToken();
    const refreshHash = hashToken(refreshToken);

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,NOW()+interval '30 days')",
      [userId, refreshHash]
    );

    const accessToken = signAccessToken(userId, req.headers["user-agent"]);
    res.json({ accessToken, refreshToken });

  } catch {
    res.status(401).json({ error: "Invalid telegram auth" });
  }
});

app.post("/api/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  const hash = hashToken(refreshToken);

  const { rows } = await pool.query(
    "SELECT * FROM refresh_tokens WHERE token_hash=$1 AND revoked=false AND expires_at > NOW()",
    [hash]
  );

  if (rows.length === 0)
    return res.status(401).json({ error: "Invalid refresh token" });

  const tokenRow = rows[0];

  await pool.query(
    "UPDATE refresh_tokens SET revoked=true WHERE id=$1",
    [tokenRow.id]
  );

  const newRefresh = generateRefreshToken();
  const newHash = hashToken(newRefresh);

  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,NOW()+interval '30 days')",
    [tokenRow.user_id, newHash]
  );

  const newAccess = signAccessToken(
    tokenRow.user_id,
    req.headers["user-agent"]
  );

  res.json({ accessToken: newAccess, refreshToken: newRefresh });
});

app.post("/api/addcoins", auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE users
      SET balance = balance + $1,
          last_clicked = NOW()
      WHERE telegram_id = $2
        AND (last_clicked IS NULL OR NOW() - last_clicked > interval '500 ms')
      RETURNING balance
      `,
      [INCREMENT, req.userId]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(429).json({ error: "Too fast" });
    }

    await client.query(
      "INSERT INTO coin_events (user_id,type,amount,ip,user_agent) VALUES ($1,'mint',$2,$3,$4)",
      [
        req.userId,
        INCREMENT,
        req.ip,
        req.headers["user-agent"]
      ]
    );

    await client.query("COMMIT");
    res.json({ balance: result.rows[0].balance });

  } catch {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Internal error" });
  } finally {
    client.release();
  }
});

app.get("/api/me", auth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT balance, coin_multiplier FROM users WHERE telegram_id=$1",
    [req.userId]
  );

  res.json(rows[0]);
});

app.get("/api/leaderboard", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT first_name,balance FROM users ORDER BY balance DESC LIMIT 10"
  );
  res.json(rows);
});

function verifyTelegram(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort()
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(process.env.BOT_TOKEN)
    .digest();

  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (hmac !== hash) throw new Error("Bad signature");

  const authDate = Number(params.get("auth_date"));
  if (Date.now()/1000 - authDate > 3600)
    throw new Error("Expired");

  return JSON.parse(params.get("user"));
}

app.listen(process.env.PORT || 8080);