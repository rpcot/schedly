module.exports = {
    name: 'my_id',
    description: 'Получить свой Телеграм айди',
    hide: false,
    async execute(bot, ctx) {

        try {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
        } catch(_) {}

        const mention = (ctx.from.username)
            ? `@${ctx.from.username}`
            : `${ctx.from.first_name} ${ctx.from.last_name}`;

        const msg = await ctx.reply(`${mention}, твой Telegram ID - <code>${ctx.from.id}</code> (кликните, чтобы скопировать)`, {
            parse_mode: 'HTML',
        });
    
        setTimeout(async () => {
            try {
                await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
            } catch(_) {}
        }, 10 * 1000);

    }
};
