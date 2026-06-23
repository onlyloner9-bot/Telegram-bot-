require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

// ===== SETTINGS =====
let settings = {
  antilink: true,
  antibadword: true,
  antispam: true,
};

// ===== BAD WORD LIST (EDIT IT) =====
const badWords = ["badword1", "badword2", "fuck", "shit"];

// ===== SPAM TRACKING =====
const userMessages = {};

// ===== HELPER: CHECK ADMIN =====
async function isAdmin(ctx) {
  try {
    const member = await ctx.getChatMember(ctx.from.id);
    return ["creator", "administrator"].includes(member.status);
  } catch {
    return false;
  }
}

// ===== START =====
bot.start((ctx) => {
  ctx.reply(
    "👋 Welcome to Group Manager Bot\n\nCommands:\n/antilink on|off\n/antibadword on|off\n/antispam on|off\n/ban\n/kick\n/mute\n/help"
  );
});

// ===== HELP =====
bot.command("help", (ctx) => {
  ctx.reply(`
🤖 Group Management Bot Commands:

⚙️ SETTINGS:
/antilink on|off
/antibadword on|off
/antispam on|off

🛡 ADMIN ACTIONS:
/ban (reply to user)
/kick (reply to user)
/mute (reply to user)
`);
});

// ===== TOGGLE COMMANDS =====
bot.command("antilink", async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("❌ Admin only");
  const arg = ctx.message.text.split(" ")[1];
  settings.antilink = arg === "on";
  ctx.reply(`🔗 Anti-link is now ${settings.antilink ? "ON" : "OFF"}`);
});

bot.command("antibadword", async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("❌ Admin only");
  const arg = ctx.message.text.split(" ")[1];
  settings.antibadword = arg === "on";
  ctx.reply(`🚫 Anti-badword is now ${settings.antibadword ? "ON" : "OFF"}`);
});

bot.command("antispam", async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("❌ Admin only");
  const arg = ctx.message.text.split(" ")[1];
  settings.antispam = arg === "on";
  ctx.reply(`⚡ Anti-spam is now ${settings.antispam ? "ON" : "OFF"}`);
});

// ===== ADMIN ACTIONS =====
bot.command("ban", async (ctx) => {
  if (!(await isAdmin(ctx))) return;

  if (!ctx.message.reply_to_message) {
    return ctx.reply("Reply to a user to ban");
  }

  const userId = ctx.message.reply_to_message.from.id;
  await ctx.banChatMember(userId);
  ctx.reply("🔨 User banned");
});

bot.command("kick", async (ctx) => {
  if (!(await isAdmin(ctx))) return;

  if (!ctx.message.reply_to_message) {
    return ctx.reply("Reply to a user to kick");
  }

  const userId = ctx.message.reply_to_message.from.id;
  await ctx.banChatMember(userId);
  await ctx.unbanChatMember(userId);
  ctx.reply("👢 User kicked");
});

bot.command("mute", async (ctx) => {
  if (!(await isAdmin(ctx))) return;

  if (!ctx.message.reply_to_message) {
    return ctx.reply("Reply to a user to mute");
  }

  const userId = ctx.message.reply_to_message.from.id;

  await ctx.restrictChatMember(userId, {
    permissions: {
      can_send_messages: false,
    },
  });

  ctx.reply("🔇 User muted");
});

// ===== ANTI-LINK =====
bot.on("text", async (ctx) => {
  const text = ctx.message.text.toLowerCase();
  const userId = ctx.from.id;

  // ANTI LINK
  if (settings.antilink) {
    if (text.includes("http://") || text.includes("https://") || text.includes("t.me/")) {
      if (!(await isAdmin(ctx))) {
        await ctx.deleteMessage();
        return ctx.reply("🚫 Links are not allowed here!");
      }
    }
  }

  // ANTI BAD WORD
  if (settings.antibadword) {
    for (let word of badWords) {
      if (text.includes(word)) {
        if (!(await isAdmin(ctx))) {
          await ctx.deleteMessage();
          return ctx.reply("🚫 Bad words are not allowed!");
        }
      }
    }
  }

  // ANTI SPAM
  if (settings.antispam) {
    if (!userMessages[userId]) userMessages[userId] = [];

    const now = Date.now();
    userMessages[userId].push(now);

    userMessages[userId] = userMessages[userId].filter(
      (t) => now - t < 4000
    );

    if (userMessages[userId].length > 5) {
      await ctx.deleteMessage();
      return ctx.reply("⚠️ Stop spamming!");
    }
  }
});

// ===== ERROR HANDLING =====
bot.catch((err) => console.log("Bot error:", err));

// ===== START BOT =====
bot.launch();
console.log("🤖 Bot is running...");
