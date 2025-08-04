const { showLessonChoose, getDayScheduleById } = require("../utils/schedule-functions");

module.exports = {
    data: 'choose_lesson',
    async execute(bot, ctx, userId, dataId, inlineId) {

        const data = await getDayScheduleById(dataId);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        } else {
            await ctx.answerCallbackQuery();
        }

        await showLessonChoose(ctx, data, inlineId);

    }
};
