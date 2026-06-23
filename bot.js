
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
