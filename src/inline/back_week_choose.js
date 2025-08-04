const { showScheduleManage } = require("../utils/schedule-functions");

module.exports = {
    data: 'back_week_choose',
    async execute(bot, ctx, userId) {

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else {
            await ctx.answerCallbackQuery();
        }

        await showScheduleManage(ctx, { update: true });

    }
};
