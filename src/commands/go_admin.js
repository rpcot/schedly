const { sendGoAdminRules } = require("../utils/users-functions");
const { errorAnswer } = require("../utils/utils");

module.exports = {
    name: 'go_admin',
    description: 'Стать админом',
    hide: false,
    async execute(bot, ctx) {
        if (ctx.chat.type !== 'private')
            return await errorAnswer(ctx, 'Данная команда доступна <b>только</b> в личных сообщениях с ботом', {
                deleteAfter: 5,
            });

        await sendGoAdminRules(ctx);
    }
};
