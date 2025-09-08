module.exports = {
    data: 'hide_attachment',
    async execute(bot, ctx) {
        await ctx.answerCallbackQuery()
            .catch(() => { });

        await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id)
            .catch(() => { });
    }
};
