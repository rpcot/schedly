const { showScheduleManage } = require("../utils/schedule-functions");
const { checkAdminPerms } = require("../utils/users-functions");
const { errorAnswer } = require("../utils/utils");

module.exports = {
    name: 'manage',
    description: 'Управление расписанием',
    hide: false,
    async execute(bot, ctx) {

        if (ctx.chat.type !== 'private')
            return await errorAnswer(ctx, 'Данная команда доступна <b>только</b> в личных сообщениях с ботом', {
                deleteAfter: 5,
            });

        const isAdmin = await checkAdminPerms(ctx.from.id);
        if (!isAdmin)
            return await errorAnswer(ctx, 'У вас <b>нет прав</b> на выполнение данного действия', {
                deleteAfter: 5,
            });

        await showScheduleManage(ctx, { update: false });

    }
};
