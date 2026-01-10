require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");

const { Pool } = require("pg");

const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }});

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
    let referredBy = null;

    if(ctx.message.text.split(" ")[1]){
        try{
            let decoded = Decode(ctx.message.text.split(" ")[1]?.trim());
            if (!isNaN(decoded)) referredBy = decoded;
        }catch(e){
            console.log("Failed to decode id from link: ", e);
        }
    }

    const added = await TryAddUser(ctx.from.id, referredBy, ctx.from.username, ctx.from.first_name);

    let str = "";

    if(referredBy && added)
        str = "You have been invited by someone! ";

    ctx.reply(`Welcome to the official TQA meme coin bot!🚀 ${str}Choose action you want me to do:`, Markup.inlineKeyboard([
        [Markup.button.callback("Create Referral Link", "CREATE_REF"), Markup.button.callback("My Referral Stats", "SHOW_REF")],
        [Markup.button.callback("Enter Mini App", "ENTER_APP")],
        [Markup.button.callback("Referral Leaderboard", "SHOW_LEADERBOARD")],
        [Markup.button.url("Join News Channel", "https://t.me/+-vL_K7ydtfQ5NWE6"), Markup.button.url("Join Meme Channel", "https://t.me/+R76a4MOb-EQyYjky")]
    ]));
});

bot.action("SHOW_LEADERBOARD", async (ctx) => {
    ctx.answerCbQuery();

    const leaderboard = await TryGetLeaderboard();
    ctx.reply(leaderboard);
});

bot.action("CREATE_REF", (ctx) => {
    ctx.answerCbQuery();

    const encodedId = Encode(ctx.from.id);

    ctx.reply(`Succesfully created a referral link! Link: https://t.me/tqa_coin_bot?start=${encodedId}`);
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

        if(referredBy){
            const refCheck = await client.query("SELECT 1 FROM users WHERE telegram_id = $1", [referredBy]);
            if(refCheck.rows.length > 0) {
                await client.query("UPDATE users SET referral_count = referral_count + 1 WHERE telegram_id = $1", [referredBy]);
            }
        }

        return true;
    }
    finally{
        client.release();
    }
}

async function TryGetLeaderboard(){
    const client = await pool.connect();

    try{
        const res = await client.query("SELECT first_name, referral_count FROM users WHERE referral_count > 0 ORDER BY referral_count DESC LIMIT 10");

        if (res.rows.length === 0) {
            return "No referrals yet 👀";
        }

        let text = "🏆 Referral Leaderboard\n\n";

        res.rows.forEach((row, index) => {
            const medals = ["🥇", "🥈", "🥉"];
            const badge = medals[index] || "🔹";
            const name = row.first_name || "Anonymous";
            text += `${badge} ${name} – ${row.referral_count}\n`;
        });

        return text;
    }
    catch(err){
        console.error(err);
        return "Failed to load leaderboard 😢";
    }
    finally{
        client.release();
    }
}

function Encode(str){
    return Buffer.from(str.toString()).toString("base64url");
}

function Decode(str){
    return parseInt(Buffer.from(str, "base64url").toString("utf-8"));
}