require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply("Welcome to the official TQA meme coin bot!🚀 Choose action you want me to do:", Markup.inlineKeyboard([
        [Markup.button.callback("Create Referral Link", "CREATE_REF"), Markup.button.callback("My Referral Stats", "SHOW_REF")],
        [Markup.button.callback("Enter Mini App", "ENTER_APP")],
        [Markup.button.url("Join Meme Channel", "https://t.me/+R76a4MOb-EQyYjky")]
    ]));
});

bot.action("CREATE_REF", (ctx) => {
    ctx.answerCbQuery();

    ctx.reply("This button is supposed to create u a referral link.");
});

bot.action("SHOW_REF", (ctx) => {
    ctx.answerCbQuery();

    ctx.reply("This button is supposed to display info about ur referral link.");
});

bot.action("ENTER_APP", (ctx) => {
    ctx.answerCbQuery();

    ctx.reply("This button will open the mini-app");
});

bot.launch().then(() => console.log("Bot is running!")).catch((err) => console.error("Bot launch failed:", err));