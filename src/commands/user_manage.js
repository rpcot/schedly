const { showUserManagePanel, getUserData } = require("../utils/users-functions");
const { errorAnswer } = require("../utils/utils");

module.exports = {
    name: 'user_manage',
    description: 'Управление пользователем',
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

        const args = ctx.msg.text.split(' ');

        const userId = args[1];

        if (!userId)
            return void await errorAnswer(ctx, `Не указан айди пользователя`, {
                deleteAfter: 5
            });

        await showUserManagePanel(ctx, userId);

    }
};
