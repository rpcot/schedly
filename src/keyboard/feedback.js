const { sendFeedbackRequest } = require("../utils/feedback-functions");

module.exports = {
    data: '💖 Обратная связь',
    async execute(bot, ctx) {
        if (ctx.chat.type !== 'private') return;

        await sendFeedbackRequest(ctx);
    }
};
