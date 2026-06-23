const TelegramBot = require("node-telegram-bot-api")

const token = process.env.BOT_TOKEN
if (!token) {
  console.log("❌ BOT_TOKEN missing")
  process.exit(1)
}

const bot = new TelegramBot(token, { polling: true })

console.log("🤖 Protected Bot Running...")

// ================= STORAGE =================
const userWarnings = {}
const badWords = ["fuck", "shit", "bitch", "asshole"] // edit this
const spamTracker = {}

// ================= CHECK ADMIN =================
async function isAdmin(chatId, userId) {
  try {
    const admins = await bot.getChatAdministrators(chatId)
    return admins.some(a => a.user.id === userId)
  } catch {
    return false
  }
}

// ================= DELETE MESSAGE =================
async function deleteMsg(chatId, msgId) {
  try {
    await bot.deleteMessage(chatId, msgId)
  } catch {}
}

// ================= ANTI-LINK =================
bot.on("message", async (msg) => {
  if (!msg.text) return

  const chatId = msg.chat.id
  const userId = msg.from.id

  if (await isAdmin(chatId, userId)) return

  if (msg.text.includes("http") || msg.text.includes("t.me") || msg.text.includes("www.")) {
    await deleteMsg(chatId, msg.message_id)
    bot.sendMessage(chatId, "🚫 Links are not allowed here.")
  }
})

// ================= ANTI-BAD WORDS =================
bot.on("message", async (msg) => {
  if (!msg.text) return

  const chatId = msg.chat.id
  const userId = msg.from.id
  const text = msg.text.toLowerCase()

  if (await isAdmin(chatId, userId)) return

  for (let word of badWords) {
    if (text.includes(word)) {
      await deleteMsg(chatId, msg.message_id)

      userWarnings[userId] = (userWarnings[userId] || 0) + 1

      if (userWarnings[userId] >= 3) {
        try {
          await bot.banChatMember(chatId, userId)
          bot.sendMessage(chatId, "🚫 User banned for repeated bad words.")
        } catch {}
      } else {
        bot.sendMessage(chatId, `⚠️ Warning ${userWarnings[userId]}/3`)
      }
      return
    }
  }
})

// ================= ANTI-SPAM =================
bot.on("message", async (msg) => {
  const chatId = msg.chat.id
  const userId = msg.from.id

  if (await isAdmin(chatId, userId)) return

  const now = Date.now()

  if (!spamTracker[userId]) {
    spamTracker[userId] = []
  }

  spamTracker[userId].push(now)

  // keep last 5 seconds messages
  spamTracker[userId] = spamTracker[userId].filter(t => now - t < 5000)

  if (spamTracker[userId].length > 5) {
    await deleteMsg(chatId, msg.message_id)
    bot.sendMessage(chatId, "🚫 Stop spamming!")

    try {
      await bot.kickChatMember(chatId, userId)
    } catch {}
  }
})

// ================= ANTI-MENTION SPAM =================
bot.on("message", async (msg) => {
  if (!msg.text) return

  const chatId = msg.chat.id
  const userId = msg.from.id

  if (await isAdmin(chatId, userId)) return

  const mentions = (msg.text.match(/@/g) || []).length

  if (mentions > 3) {
    await deleteMsg(chatId, msg.message_id)
    bot.sendMessage(chatId, "🚫 Too many mentions!")
  }
})

// ================= BASIC COMMANDS =================
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 Protected Group Bot Active")
})

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
`📌 Commands:
/ban (reply)
/unban (reply)
/kick (reply)`
  )
})

// ================= BAN =================
bot.onText(/\/ban/, async (msg) => {
  if (!msg.reply_to_message) return
  try {
    await bot.banChatMember(msg.chat.id, msg.reply_to_message.from.id)
    bot.sendMessage(msg.chat.id, "🚫 Banned")
  } catch {}
})

// ================= UNBAN =================
bot.onText(/\/unban/, async (msg) => {
  if (!msg.reply_to_message) return
  try {
    await bot.unbanChatMember(msg.chat.id, msg.reply_to_message.from.id)
    bot.sendMessage(msg.chat.id, "✅ Unbanned")
  } catch {}
})

// ================= KICK =================
bot.onText(/\/kick/, async (msg) => {
  if (!msg.reply_to_message) return
  try {
    await bot.kickChatMember(msg.chat.id, msg.reply_to_message.from.id)
    bot.sendMessage(msg.chat.id, "👢 Kicked")
  } catch {}
})
