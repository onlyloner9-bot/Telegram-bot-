from telegram import Update, ChatPermissions
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

TOKEN = "YOUR_BOT_TOKEN"

# ---------------- START ----------------
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🤖 Group Management Bot is Active!")

# ---------------- ADMIN CHECK ----------------
async def is_admin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = await context.bot.get_chat_member(update.effective_chat.id, update.effective_user.id)
    return user.status in ["administrator", "creator"]

# ---------------- KICK ----------------
async def kick(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, context):
        return await update.message.reply_text("❌ Admin only")

    if update.message.reply_to_message:
        user_id = update.message.reply_to_message.from_user.id
        await context.bot.ban_chat_member(update.effective_chat.id, user_id)
        await update.message.reply_text("👢 User kicked!")
    else:
        await update.message.reply_text("Reply to a user")

# ---------------- BAN ----------------
async def ban(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, context):
        return await update.message.reply_text("❌ Admin only")

    if update.message.reply_to_message:
        user_id = update.message.reply_to_message.from_user.id
        await context.bot.ban_chat_member(update.effective_chat.id, user_id)
        await update.message.reply_text("⛔ User banned!")
    else:
        await update.message.reply_text("Reply to a user")

# ---------------- MUTE ----------------
async def mute(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, context):
        return await update.message.reply_text("❌ Admin only")

    if update.message.reply_to_message:
        user_id = update.message.reply_to_message.from_user.id

        permissions = ChatPermissions(
            can_send_messages=False
        )

        await context.bot.restrict_chat_member(
            update.effective_chat.id,
            user_id,
            permissions
        )

        await update.message.reply_text("🔇 User muted")
    else:
        await update.message.reply_text("Reply to a user")

# ---------------- UNMUTE ----------------
async def unmute(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, context):
        return await update.message.reply_text("❌ Admin only")

    if update.message.reply_to_message:
        user_id = update.message.reply_to_message.from_user.id

        permissions = ChatPermissions(
            can_send_messages=True,
            can_send_media_messages=True,
            can_send_other_messages=True,
            can_send_polls=True,
            can_add_web_page_entries=True
        )

        await context.bot.restrict_chat_member(
            update.effective_chat.id,
            user_id,
            permissions
        )

        await update.message.reply_text("🔊 User unmuted")

# ---------------- ANTI-LINK ----------------
async def anti_link(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message and update.message.text:
        text = update.message.text.lower()

        links = ["http://", "https://", "t.me", "www."]

        if any(link in text for link in links):
            try:
                user_id = update.message.from_user.id

                member = await context.bot.get_chat_member(update.effective_chat.id, user_id)

                if member.status not in ["administrator", "creator"]:
                    await update.message.delete()
            except:
                pass

# ---------------- MAIN ----------------
def main():
    app = Application.builder().token(TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("kick", kick))
    app.add_handler(CommandHandler("ban", ban))
    app.add_handler(CommandHandler("mute", mute))
    app.add_handler(CommandHandler("unmute", unmute))

    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, anti_link))

    print("Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
