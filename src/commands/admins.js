const { getUserData, showAdminsList } = require("../utils/users-functions");
const { errorAnswer } = require("../utils/utils");

module.exports = {
    name: 'admins',
    description: 'Посмотреть список админов',
    hide: true,
    async execute(bot, ctx) {
        try {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
        } catch(_) {}

        const userdata = await getUserData(ctx.from.id);
        if (userdata.group !== 'developer')
            return void await errorAnswer(ctx, `У тебя <b>нет прав</b> для использования данной команды`, {
                deleteAfter: 5
            });

        await showAdminsList(ctx);
    }
};
