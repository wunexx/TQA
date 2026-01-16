import express from "express";

const { Pool } = require("pg");

const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }});

const app = express();

app.listen(process.env.PORT || 3000, () => console.log("Server running"));

app.use(express.json());

app.get("/api/getcoins/:id", async (message, reply) =>{
    const coins = await GetCoinCount(message.params.id);
    reply.send(coins);
});

app.get("/api/getmult/:id", async (message, reply) => {
    const mult = await GetCoinMultiplier(message.params.id);
    reply.send(mult);
});

app.post("/api/addcoins", async (message, reply) => {
    const id = message.body.telegram_id;
    const amount = message.body.amount;

    const newCoins = await AddCoinsToUser(id, amount);
    reply.send(newCoins);
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