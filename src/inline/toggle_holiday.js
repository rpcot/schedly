const { sendActionLog } = require("../utils/logging-functions");
const { getDayScheduleById, showManageDay } = require("../utils/schedule-functions");

module.exports = {
    data: 'toggle_holiday',
    async execute(bot, ctx, userId, dataId) {

        const data = await getDayScheduleById(dataId);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        } else {
            await ctx.answerCallbackQuery();
        }

        data.holiday = !data.holiday;
        await data.save();

        await showManageDay(ctx, data.weekId, data.index);

        await sendActionLog(ctx, 'Изменен статус учебного дня', [
            `Новое значение: ${(data.holiday) ? 'Неучебный' : 'Учебный'}`,
            `Айди дня: ${data.id}`,
            `Айди недели: ${data.weekId}`,
        ]);

    }
};
