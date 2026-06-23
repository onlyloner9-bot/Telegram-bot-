require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

// ================= SETTINGS =================
const settings = {
  antilink: true,
  antibadword: true,
  antispam: true,
  antiforward: false,
};

// ================= DATA =================
const spamMap = {};
const warns = {};
const badWords = ["badword1", "badword2", "fuck", "shit"];

// ================= SAFE ADMIN CHECK =================
async function isAdmin(ctx) {
  try {
    const m = await ctx.getChatMember(ctx.from.id);
    return ["creator", "administrator"].includes(m.status);
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
  ctx.reply(`
🤖 Group Manager Bot

⚙ Settings:
/antilink on|off
/antibadword on|off
/antispam on|off
/antiforward on|off

👮 Admin:
/ban (reply)
/kick (reply)
/mute (reply)
/warn (reply)
/warns
`);
});

// ================= TOGGLES =================
function toggleCommand(cmd, key, label) {
  bot.command(cmd, async (ctx) => {
    if (!(await isAdmin(ctx))) return ctx.reply("❌ Admin only");

    const arg = ctx.message.text.split(" ")[1];
    settings[key] = arg === "on";

    ctx.reply(`${label}: ${settings[key] ? "ON" : "OFF"}`);
  });
}

toggleCommand("antilink", "antilink", "🔗 Anti-link");
toggleCommand("antibadword", "antibadword", "🚫 Anti-badword");
toggleCommand("antispam", "antispam", "⚡ Anti-spam");
toggleCommand("antiforward", "antiforward", "📩 Anti-forward");

// ================= BAN =================
bot.command("ban", async (ctx) => {
  if (!(await isAdmin(ctx))) return;

  if (!ctx.message.reply_to_message)
    return ctx.reply("Reply to a user");

  try {
    const id = ctx.message.reply_to_message.from.id;
    await ctx.banChatMember(id);
    ctx.reply("🔨 Banned");
  } catch {}
});

// ================= KICK =================
bot.command("kick", async (ctx) => {
  if (!(await isAdmin(ctx))) return;

  if (!ctx.message.reply_to_message)
    return ctx.reply("Reply to a user");

  try {
    const id = ctx.message.reply_to_message.from.id;
    await ctx.banChatMember(id);
    await ctx.unbanChatMember(id);
    ctx.reply("👢 Kicked");
  } catch {}
});

// ================= MUTE =================
bot.command("mute", async (ctx) => {
  if (!(await isAdmin(ctx))) return;

  if (!ctx.message.reply_to_message)
    return ctx.reply("Reply to a user");

  try {
    const id = ctx.message.reply_to_message.from.id;

    await ctx.restrictChatMember(id, {
      permissions: { can_send_messages: false },
    });

    ctx.reply("🔇 Muted");
  } catch {}
});

// ================= WARN SYSTEM =================
bot.command("warn", async (ctx) => {
  if (!(await isAdmin(ctx))) return;

  if (!ctx.message.reply_to_message)
    return ctx.reply("Reply to a user");

  const id = ctx.message.reply_to_message.from.id;

  warns[id] = (warns[id] || 0) + 1;

  ctx.reply(`⚠️ Warned (${warns[id]}/3)`);

  if (warns[id] >= 3) {
    try {
      await ctx.banChatMember(id);
      ctx.reply("🔨 User auto-banned (3 warns)");
    } catch {}
  }
});

bot.command("warns", (ctx) => {
  const id = ctx.from.id;
  ctx.reply(`⚠️ Your warns: ${warns[id] || 0}`);
});

// ================= MESSAGE FILTER =================
bot.on("message", async (ctx) => {
  const text = (ctx.message?.text || "").toLowerCase();
  const userId = ctx.from.id;

  // ===== ANTI-LINK =====
  if (settings.antilink && text) {
    if (text.includes("http") || text.includes("t.me")) {
      if (!(await isAdmin(ctx))) {
        await safeDelete(ctx);
        return ctx.reply("🚫 Links not allowed");
      }
    }
  }

  // ===== ANTI-BADWORD =====
  if (settings.antibadword && text) {
    for (let w of badWords) {
      if (text.includes(w)) {
        if (!(await isAdmin(ctx))) {
          await safeDelete(ctx);
          return ctx.reply("🚫 Bad words not allowed");
        }
      }
    }
  }

  // ===== ANTI-SPAM =====
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

  // ===== ANTI-FORWARD =====
  if (settings.antiforward && ctx.message.forward_date) {
    if (!(await isAdmin(ctx))) {
      await safeDelete(ctx);
      return ctx.reply("🚫 Forwarding not allowed");
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
