const { sendBotSiteURL } = require("../utils/schedule-functions");

module.exports = {
    name: 'site',
    description: 'Ссылка на сайт бота',
    async execute(bot, ctx) {

        await sendBotSiteURL(ctx);

    }
};
