import express from "express";
import cors from "cors";
import pkg from "pg";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

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

app.get("/api/getcoins/:id", async (req, res) => {
  try {
    const coins = await TryGetCoinCount(req.params.id);
    res.json({coins: coins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/getleaderboard", async (req, res) => {
  try{
    const leaderboard = await TryGetCoinLeaderboard();

    res.json({leaderboard: leaderboard});
  } catch (err){
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/addcoins", async (req, res) => {
  try {
    const { initData } = req.body;
    //console.log(`Init data: ${initData}`);
    const user = VerifyTelegram(initData);
    //console.log(`Init data: ${initData}\nUser id: ${user.id}\nUsername: ${user.username}`)
    const mult = await TryGetCoinMultiplier(user.id);
    const newCoins = await TryAddCoinsToUser(user.id, INCREMENT * mult);
    //console.log(`New coins: ${newCoins}\nMultiplier: ${mult}\nDelta: ${INCREMENT * mult}\nTelegram Id: ${user.id}`);

    res.json({ new_coins: newCoins });
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
});


app.get("/api/test", async (req, res) => {
  console.log("working properly!");
  res.json({ hi: "hi" });
});

async function TryGetCoinMultiplier(telegram_id) {
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

async function TryAddCoinsToUser(telegram_id, amount) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "UPDATE users SET pending_coin_count = ROUND(pending_coin_count + $1, 6) WHERE telegram_id = $2 RETURNING pending_coin_count",
      [amount, telegram_id]
    );
    if (res.rowCount === 0) return false;
    return res.rows[0].pending_coin_count;
  } finally {
    client.release();
  }
}

async function TryGetCoinCount(telegram_id) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT pending_coin_count FROM users WHERE telegram_id = $1",
      [telegram_id]
    );
    if (res.rows.length === 0) return 0;
    return res.rows[0].pending_coin_count ?? 0;
  } finally {
    client.release();
  }
}

async function TryGetCoinLeaderboard(){
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT first_name, pending_coin_count FROM users WHERE pending_coin_count > 0 ORDER BY pending_coin_count DESC LIMIT 10");

    if(res.rows.length === 0) return [];

    const medals = ["🥇", "🥈", "🥉"];

    return res.rows.map((row, index) => {
      const badge = medals[index] || "🔹";
      const name = row.first_name || "Anonymous";
      return `${badge} ${name} - ${row.pending_coin_count}`;
    });

  } finally {
    client.release();
  }
}

function VerifyTelegram(initData) {
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
