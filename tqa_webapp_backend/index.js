import express from "express";
import cors from "cors";
import pkg from "pg";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

const { Pool } = pkg;

const INCREMENT = 0.00026;

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
    const coins = await GetCoinCount(req.params.id);
    res.json({coins: coins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/addcoins", async (req, res) => {
  try {
    const { initData } = req.body;

    console.log(initData);
    const user = verifyTelegram(initData);

    const mult = await GetCoinMultiplier(user.id);

    const newCoins = await AddCoinsToUser(user.id, INCREMENT * mult);
    res.json({ new_coins: newCoins });
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
});


app.get("/api/test", async (req, res) => {
  res.json({ hi: "hi" });
});

async function GetCoinMultiplier(telegram_id) {
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

async function AddCoinsToUser(telegram_id, amount) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "UPDATE users SET pending_coin_count = COALESCE(pending_coin_count,0) + $1 WHERE telegram_id = $2 RETURNING pending_coin_count",
      [amount, telegram_id]
    );
    if (res.rowCount === 0) return false;
    return res.rows[0].pending_coin_count;
  } finally {
    client.release();
  }
}

async function GetCoinCount(telegram_id) {
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

function verifyTelegram(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort()
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = crypto
    .createHash("sha256")
    .update(process.env.BOT_TOKEN)
    .digest();

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  if (hmac !== hash) throw new Error("Invalid Telegram signature");

  return JSON.parse(params.get("user"));
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
