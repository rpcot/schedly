const { showManageDay, showScheduleDayChoose } = require("../utils/schedule-functions");

module.exports = {
    data: 'manage',
    async execute(bot, ctx, userId, weekId, dayOfWeek) {

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else {
            await ctx.answerCallbackQuery();
        }

        if (dayOfWeek) {
            await showManageDay(ctx, weekId, parseInt(dayOfWeek));
        } else {
            await showScheduleDayChoose(ctx, weekId);
        }

    }
};
