const { admins } = require("../config");
const { showScheduleManage } = require("../utils/schedule-functions");
const { checkAdminPerms } = require("../utils/users-functions");
const { errorAnswer } = require("../utils/utils");

module.exports = {
    data: '🔧 Управление расписанием',
    async execute(bot, ctx) {
        if (ctx.chat.type !== 'private') return;

        const isAdmin = await checkAdminPerms(ctx.from.id);
        if (!isAdmin)
            return await errorAnswer(ctx, 'У вас <b>нет прав</b> на выполнение данного действия', {
                deleteAfter: 5,
            });

        await showScheduleManage(ctx);
    }
};
