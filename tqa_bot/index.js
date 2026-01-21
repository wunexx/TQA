require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const { Pool } = require("pg");

const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }});
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.launch().then(() => console.log("Bot started")).catch(err => console.error("Failed to launch bot:", err));

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
        str = "You have been invited by someone!";

    ctx.reply(`Welcome to the official TQA meme coin bot! ${str}🚀\nChoose action:`, MainMenuKeyboard());
});

bot.action("SHOW_LEADERBOARD", async (ctx) => {
    ctx.answerCbQuery();

    const leaderboard = await TryGetLeaderboard();
    await EditMessage(ctx, leaderboard, BackToMenuKeyboard());
});

bot.action("CREATE_REF", async (ctx) => {
    ctx.answerCbQuery();

    const encodedId = Encode(ctx.from.id);

    await EditMessage(ctx, `Successfully created a referral link! ⭐\nLink: https://t.me/tqa_coin_bot?start=${encodedId}`, BackToMenuKeyboard());
});

bot.action("SHOW_REF", async (ctx) => {
    ctx.answerCbQuery();

    const res = await TryGetRefCount(ctx.from.id);

    await EditMessage(ctx, `You have referred ${res.ref_count} user${res.ref_count === 1 ? "" : "s"} 🚀 Your current coin multiplier is ${res.mult}`, BackToMenuKeyboard());
});
/*
bot.action("ENTER_APP", async (ctx) => {
    ctx.answerCbQuery();

    await ctx.editMessageText("This button will open the mini-app. TEST TEST TEST", BackToMenuKeyboard());
});
*/

bot.action("BACK_TO_MENU", async (ctx) =>{
    ctx.answerCbQuery();

    await EditMessage(ctx, "Welcome to the official TQA meme coin bot! 🚀\nChoose action:", MainMenuKeyboard());
});

async function TryGetRefCount(telegram_id){
    const client = await pool.connect();

    try{
        const res = await client.query("SELECT referral_count, coin_multiplier FROM users WHERE telegram_id = $1", [telegram_id]);

    if(res.rows.length === 0) return { ref_count: 0, mult: 1 };

        return {ref_count: res.rows[0].referral_count, mult: res.rows[0].coin_multiplier};
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
                await client.query("UPDATE users SET coin_multiplier = coin_multiplier + 0.05 WHERE telegram_id = $1", [referredBy]);
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

function MainMenuKeyboard(){
    return Markup.inlineKeyboard([
        [Markup.button.callback("✨ Create Referral Link", "CREATE_REF"), Markup.button.callback("🪢 My Referral Stats", "SHOW_REF")],
        [Markup.button.webApp("🚀 Enter Mini App", "https://wunexx.github.io/TQA/")],
        [Markup.button.callback("🏆 Referral Leaderboard", "SHOW_LEADERBOARD")],
        [Markup.button.url("📃 Join News Channel", "https://t.me/+-vL_K7ydtfQ5NWE6"), Markup.button.url("🗿 Join Meme Channel", "https://t.me/+R76a4MOb-EQyYjky")]
    ]);
}

function BackToMenuKeyboard(){
    return Markup.inlineKeyboard([[Markup.button.callback("⬅️ Go back", "BACK_TO_MENU")]]);
}

async function EditMessage(ctx, text, keyboard = null){
    try{
        await ctx.editMessageText(text, keyboard);
    }
    catch(err){
        if (err?.response?.description?.includes("message is not modified")) 
            return;
        console.error("Edit failed:", err);
    }
}