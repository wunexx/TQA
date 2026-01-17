import express from "express";

import pkg from "pg";

import cors from "cors";

const { Pool } = pkg;

const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }});

await pool.query(`INSERT INTO users (telegram_id, username, first_name, referred_by_id, referral_count, coin_multiplier, pending_coin_count) VALUES ('test123', 'test', 'test', 'test1234', 0, 1, 100)`);

const app = express();

app.listen(process.env.PORT || 3000, () => console.log("Server running"));

app.use(express.json());

app.use(cors({
    origin: true
    /*
    origin: [
        "https://wunexx.github.io",
        "https://web.telegram.org",
        "https://t.me"
    ]
    */
}));

app.get("/api/getcoins/:id", async (req, res) => {
    const coins = await GetCoinCount(req.params.id);
    res.json({coins: coins});
});

app.get("/api/getmult/:id", async (req, res) => {
    const mult = await GetCoinMultiplier(req.params.id);
    res.json({multiplier: mult});
});

app.post("/api/addcoins", async (req, res) => {
    const { telegram_id, amount } = req.body;
    const newCoins = await AddCoinsToUser(telegram_id, amount);
    res.json({new_coins: newCoins});
});

async function GetCoinMultiplier(telegram_id){
    const client = await pool.connect();

    try{
        const res = await client.query('SELECT coin_multiplier FROM users WHERE telegram_id = $1', [telegram_id]);

        if(res.rows.length === 0)
            return 1;

        return res.rows[0].coin_multiplier ?? 1;
    }
    finally{
        client.release();
    }
}

async function AddCoinsToUser(telegram_id, amount) {
    const client = await pool.connect();

    try {
        const res = await client.query(`UPDATE users SET pending_coin_count = COALESCE(pending_coin_count, 0) + $1 WHERE telegram_id = $2 RETURNING pending_coin_count`, [amount, telegram_id]);

        if (res.rowCount === 0) return false;

        return res.rows[0].pending_coin_count;
    } finally {
        client.release();
    }
}

async function GetCoinCount(telegram_id){
    const client = await pool.connect();

    try{
        const res = await client.query('SELECT pending_coin_count FROM users WHERE telegram_id = $1', [telegram_id]);

        if(res.rows.length === 0)
            return 0;

        return res.rows[0].pending_coin_count ?? 0;
    }
    finally{
        client.release();
    }
}