const { sendBotSiteURL } = require("../utils/schedule-functions");

module.exports = {
    data: '🌐 Сайт бота',
    async execute(bot, ctx) {
        if (ctx.chat.type !== 'private') return;

        await sendBotSiteURL(ctx);
    }
};
