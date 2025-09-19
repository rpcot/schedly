const { getUserData } = require("../utils/users-functions");

module.exports = {
    name: 'chat_id',
    description: 'Получить Телеграм айди текущего чата',
    hide: true,
    async execute(bot, ctx) {

        const userdata = await getUserData(ctx.from.id);
        if (userdata.group !== 'developer') return;

        try {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
        } catch(_) {}

        const mention = (ctx.from.username)
            ? `@${ctx.from.username}`
            : `${ctx.from.first_name} ${ctx.from.last_name}`;

        const msg = await ctx.reply(`${mention}, Telegram ID текущего чата - <code>${ctx.chat.id}</code> (кликните, чтобы скопировать)`, {
            parse_mode: 'HTML',
        });
    
        setTimeout(async () => {
            try {
                await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
            } catch(_) {}
        }, 10 * 1000);

    }
};
