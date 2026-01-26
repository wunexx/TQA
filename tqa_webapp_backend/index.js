import express from "express";
import cors from "cors";
import pkg from "pg";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { error } from "console";

const { Pool } = pkg;

const INCREMENT = 0.000026;

let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} catch (err) {
  console.error("Failed to create DB pool:", err);
}

const app = express();

app.use(express.json());

app.use(cors({
  origin: ["https://wunexx.github.io"],
  methods: ["GET", "POST"]
}));

app.set('trust proxy', 1);

app.use(rateLimit({
  windowMs: 10 * 1000,
  max: 50
}));

app.post("/api/auth/telegram", async (req, res) => {
  try{
    const { initData } = req.body;
  
    const user = verifyTelegram(initData);

    const userId = user.id;

    const token = jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: "15m"});

    res.json({token});
  }
  catch(err){
    res.status(401).json({error: "Invalid telegram auth!"});
  }
});

function auth(req, res, next){
  try{
    const header = req.headers.authorization;

    if(!header)
      return res.status(401).json({error: "Missing Authorization Header!"});

    const token = header.split(' ')[1];

    if(!token)
      return res.status(401).json({error: "Invalid Authorization header!"});

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = payload.userId;

    next();
  }
  catch(err){
    return res.status(401).json({error: "Invalid or expired token!"});
  }
}

app.post("/api/addcoins", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const lastClicked = await getLastClick(userId);

    const now = new Date();

    if(lastClicked && now - lastClicked < 500){
      return res.status(429).json({error: "Click too fast!"});
    }

    const multiplier = await tryGetCoinMultiplier(userId);
    const newCoins = await tryAddCoinsToUser(userId, INCREMENT * multiplier);

    await updateLastClick(userId, now);

    res.json({new_coins: newCoins});

  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function getLastClick(userId){
  const client = await pool.connect();
  try{
    const res = await client.query("SELECT last_clicked FROM users WHERE telegram_id = $1", [userId]);

    if(res.rows.length === 0) return null;

    return res.rows[0].last_clicked;
  }
  finally{
    client.release();
  }
}

async function updateLastClick(userId, newTime){
  const client = await pool.connect();
  try{
    await client.query("UPDATE users SET last_clicked = $1 WHERE telegram_id = $2", [newTime, userId]);
  }
  finally{
    client.release();
  }
}

app.get("/api/me", auth, async (req, res) => {
  try{
    const userId = req.userId;

    const multiplier = await tryGetCoinMultiplier(userId);
    const balance = await tryGetCoinCount(userId);

    res.json({multiplier, balance});
  }
  catch{
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try{
    const leaderboard = await tryGetCoinLeaderboard();

    res.json({leaderboard});
  } catch (err){
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/buy-upgrade", auth, async (req, res) => {
  try{
    const { upgradeId } = req.body;

    const userId = req.userId;

    //UNDER CONSTRUCTION
  }
  catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/test", async (req, res) => {
  //console.log("working properly!");
  res.json({ hi: "hi" });
});

async function tryGetCoinMultiplier(telegram_id) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT coin_multiplier FROM users WHERE telegram_id = $1",
      [telegram_id]
    );
    if (res.rows.length === 0) return 1;
    return res.rows[0].coin_multiplier ?? 1;
  } finally {
    client.release();
  }
}

async function tryAddCoinsToUser(telegram_id, amount) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "UPDATE users SET balance = balance + $1 WHERE telegram_id = $2 RETURNING balance",
      [Number(amount.toFixed(6)), telegram_id]
    );
    if (res.rowCount === 0) return false;
    return res.rows[0].balance;
  } finally {
    client.release();
  }
}

async function tryGetCoinCount(telegram_id) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT balance FROM users WHERE telegram_id = $1",
      [telegram_id]
    );
    if (res.rows.length === 0) return 0;
    return res.rows[0].balance ?? 0;
  } finally {
    client.release();
  }
}

async function tryGetCoinLeaderboard(){
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT first_name, balance FROM users WHERE balance > 0 ORDER BY balance DESC LIMIT 10");

    if(res.rows.length === 0) return [];

    const medals = ["🥇", "🥈", "🥉"];

    return res.rows.map((row, index) => {
      const badge = medals[index] || "🔹";
      const name = row.first_name || "Anonymous";
      return `${badge} ${name} - ${row.balance}`;
    });

  } finally {
    client.release();
  }
}

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

  if (hmac !== hash) {
    console.error("Signature mismatch");
    throw new Error("Invalid Telegram signature");
  }

  const authDate = Number(params.get("auth_date"));
  const timeNow = Math.floor(Date.now() / 1000);
  if (timeNow - authDate > 3600) {
      console.error("Telegram data is outdated");
      throw new Error("Telegram data is outdated");
  }

  return JSON.parse(params.get("user"));
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
