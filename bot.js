require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

// ================= SETTINGS =================
const settings = {
  antilink: true,
  antibadword: true,
  antispam: true,
};

// ================= BAD WORD LIST =================
const badWords = ["badword1", "badword2", "fuck", "shit"];

// ================= SPAM TRACKER =================
const spamMap = {};

// ================= SAFE ADMIN CHECK =================
async function isAdmin(ctx) {
  try {
    const member = await ctx.getChatMember(ctx.from.id);
    return ["creator", "administrator"].includes(member.status);
  } catch {
    return false;
  }
}

// ================= SAFE DELETE =================
async function safeDelete(ctx) {
  try {
    await ctx.deleteMessage(ctx.message.message_id);
  } catch {}
}

// ================= START =================
bot.start((ctx) => {
  ctx.reply(
`🤖 Group Management Bot

⚙ Commands:
/antilink on|off
/antibadword on|off
/antispam on|off

👮 Admin:
/ban (reply)
/kick (reply)
/mute (reply)`
  );
});

// ================= TOGGLE COMMANDS =================
bot.command("antilink", async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("❌ Admin only");

  const arg = ctx.message.text.split(" ")[1];
  settings.antilink = arg === "on";

  ctx.reply(`🔗 Anti-link: ${settings.antilink ? "ON" : "OFF"}`);
});

bot.command("antibadword", async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("❌ Admin only");

  const arg = ctx.message.text.split(" ")[1];
  settings.antibadword = arg === "on";

  ctx.reply(`🚫 Anti-badword: ${settings.antibadword ? "ON" : "OFF"}`);
});

bot.command("antispam", async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("❌ Admin only");

  const arg = ctx.message.text.split(" ")[1];
  settings.antispam = arg === "on";

  ctx.reply(`⚡ Anti-spam: ${settings.antispam ? "ON" : "OFF"}`);
});

// ================= BAN =================
bot.command("ban", async (ctx) => {
  if (!(await isAdmin(ctx))) return;

  if (!ctx.message.reply_to_message)
    return ctx.reply("Reply to a user to ban");

  try {
    const userId = ctx.message.reply_to_message.from.id;
    await ctx.banChatMember(userId);
    ctx.reply("🔨 User banned");
  } catch {
    ctx.reply("❌ Failed to ban user");
  }
});

// ================= KICK =================
bot.command("kick", async (ctx) => {
  if (!(await isAdmin(ctx))) return;

  if (!ctx.message.reply_to_message)
    return ctx.reply("Reply to a user to kick");

  try {
    const userId = ctx.message.reply_to_message.from.id;
    await ctx.banChatMember(userId);
    await ctx.unbanChatMember(userId);
    ctx.reply("👢 User kicked");
  } catch {
    ctx.reply("❌ Failed to kick user");
  }
});

// ================= MUTE =================
bot.command("mute", async (ctx) => {
  if (!(await isAdmin(ctx))) return;

  if (!ctx.message.reply_to_message)
    return ctx.reply("Reply to a user to mute");

  try {
    const userId = ctx.message.reply_to_message.from.id;

    await ctx.restrictChatMember(userId, {
      permissions: {
        can_send_messages: false,
      },
    });

    ctx.reply("🔇 User muted");
  } catch {
    ctx.reply("❌ Failed to mute user");
  }
});

// ================= MESSAGE FILTER =================
bot.on("text", async (ctx) => {
  const text = (ctx.message?.text || "").toLowerCase();
  const userId = ctx.from.id;

  // ===== ANTI LINK =====
  if (settings.antilink) {
    if (text.includes("http://") || text.includes("https://") || text.includes("t.me/")) {
      if (!(await isAdmin(ctx))) {
        await safeDelete(ctx);
        return ctx.reply("🚫 Links are not allowed");
      }
    }
  }

  // ===== ANTI BAD WORD =====
  if (settings.antibadword) {
    for (let word of badWords) {
      if (text.includes(word)) {
        if (!(await isAdmin(ctx))) {
          await safeDelete(ctx);
          return ctx.reply("🚫 Bad words are not allowed");
        }
      }
    }
  }

  // ===== ANTI SPAM =====
  if (settings.antispam) {
    if (!spamMap[userId]) spamMap[userId] = [];

    const now = Date.now();
    spamMap[userId].push(now);

    spamMap[userId] = spamMap[userId].filter(t => now - t < 4000);

    if (spamMap[userId].length > 5) {
      await safeDelete(ctx);
      return ctx.reply("⚠️ Stop spamming");
    }
  }
});

// ================= ERROR HANDLER =================
bot.catch((err) => {
  console.log("BOT ERROR:", err);
});

// ================= START BOT =================
bot.launch();
console.log("🤖 Bot is running...");
