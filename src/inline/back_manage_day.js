const { getDayScheduleById, showManageDay } = require("../utils/schedule-functions");
const { setWait } = require("../utils/users-functions");

module.exports = {
    data: 'back_manage_day',
    async execute(bot, ctx, userId, dataId) {

        const data = await getDayScheduleById(dataId);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        } else {
            await ctx.answerCallbackQuery();
        }

        await setWait(ctx.from.id, {});

        await showManageDay(ctx, data.weekId, data.index);

    }
};
