require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");

const { Pool } = require("pg");

const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }});

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
    const referredBy = ctx.message.text.split(" ")[1] ? Number(ctx.message.text.split(" ")[1]) : null;

    const added = await TryAddUser(ctx.from.id, referredBy, ctx.from.username, ctx.from.first_name);

    let str = "";

    if(referredBy)
        str = "You have been invited by someone!";

    ctx.reply(`Welcome to the official TQA meme coin bot!🚀 ${str} Choose action you want me to do:`, Markup.inlineKeyboard([
        [Markup.button.callback("Create Referral Link", "CREATE_REF"), Markup.button.callback("My Referral Stats", "SHOW_REF")],
        [Markup.button.callback("Enter Mini App", "ENTER_APP")],
        [Markup.button.url("Join News Channel", "https://t.me/+-vL_K7ydtfQ5NWE6"), Markup.button.url("Join Meme Channel", "https://t.me/+R76a4MOb-EQyYjky")]
    ]));
});



bot.action("CREATE_REF", (ctx) => {
    ctx.answerCbQuery();

    ctx.reply(`Succesfully created a referral link! Link: https://t.me/tqa_coin_bot?start=${ctx.from.id}`);
});

bot.action("SHOW_REF", async (ctx) => {
    ctx.answerCbQuery();

    const res = await TryGetRefCount(ctx.from.id);

    if(!res || res.rows.length === 0){
        ctx.reply("You have not referred anyone yet.");
        return;
    }

    const count = Number(res.rows[0].referral_count);

    ctx.reply(`You have referred ${count} user${count === 1 ? "" : "s"} 🚀`);
});

bot.action("ENTER_APP", (ctx) => {
    ctx.answerCbQuery();

    ctx.reply("This button will open the mini-app");
});

bot.launch().then(() => console.log("Bot is running!")).catch((err) => console.error("Bot launch failed:", err));

async function TryGetRefCount(telegram_id){
    const client = await pool.connect();

    try{
        const count = await client.query("SELECT referral_count FROM users WHERE telegram_id = $1", [telegram_id]);
        return count;
    }
    finally{
        client.release();
    }
}

async function TryAddUser(telegramId, referredBy = null, username = null, firstName = null){
    const client = await pool.connect();

    try{
        const res = await client.query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);

        if(res.rows.length > 0)
            return false;

        await client.query("INSERT INTO users (telegram_id, username, first_name, referred_by_id, referral_count) VALUES ($1, $2, $3, $4, $5)", [telegramId, username, firstName, referredBy, 0]);

        if(referredBy)
            await client.query("UPDATE users SET referral_count = referral_count + 1 WHERE telegram_id = $1", [referredBy]);

        return true;
    }
    finally{
        client.release();
    }
}