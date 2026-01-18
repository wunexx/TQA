import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;

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
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));


app.get("/api/getcoins/:id", async (req, res) => {
  try {
    const coins = await GetCoinCount(req.params.id);
    res.json({ coins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/getmult/:id", async (req, res) => {
  try {
    const mult = await GetCoinMultiplier(req.params.id);
    res.json({ multiplier: mult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/addcoins", async (req, res) => {
  try {
    const { telegram_id, amount } = req.body;
    const newCoins = await AddCoinsToUser(telegram_id, amount);
    res.json({ new_coins: newCoins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
