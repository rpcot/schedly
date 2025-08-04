const { sendGoAdminRules } = require("../utils/users-functions");

module.exports = {
    data: '🚀 Стать админом',
    async execute(bot, ctx) {
        if (ctx.chat.type !== 'private') return;

        await sendGoAdminRules(ctx);
    }
};
