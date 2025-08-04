const { sendFeedbackRequest } = require("../utils/feedback-functions");
const { errorAnswer } = require("../utils/utils");

module.exports = {
    name: 'feedback',
    description: 'Отправить сообщение разработчику',
    hide: false,
    async execute(bot, ctx) {
        if (ctx.chat.type !== 'private')
            return await errorAnswer(ctx, 'Данная команда доступна <b>только</b> в личных сообщениях с ботом', {
                deleteAfter: 5,
            });

        await sendFeedbackRequest(ctx);
    }
};
