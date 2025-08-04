const { setWait } = require("../utils/users-functions");

module.exports = {
    data: 'cancel',
    async execute(bot, ctx) {
        try {
            await setWait(ctx.from.id, {});
            await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
        } catch (_) { }
    }
};
