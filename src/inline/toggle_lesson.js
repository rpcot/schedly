const { Days } = require("../models");
const { sendActionLog } = require("../utils/logging-functions");
const { showToggleLessonChoose, getDayScheduleById } = require("../utils/schedule-functions");

module.exports = {
    data: 'toggle_lesson',
    async execute(bot, ctx, userId, dataId, lessonIndex) {

        const data = await getDayScheduleById(dataId);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        } else {
            await ctx.answerCallbackQuery();
        }

        if (lessonIndex) {
            data.lessons[parseInt(lessonIndex)].canceled = !data.lessons[parseInt(lessonIndex)].canceled;
            await Days.update({ lessons: data.lessons }, { where: { id: data.id } });

            const lessonData = data.lessons[parseInt(lessonIndex)];

            await sendActionLog(ctx, 'Изменён статус урока', [
                `Новое значение: ${(lessonData.canceled) ? 'Отменён' : 'По умолчанию'}`,
                `Урок: ${lessonData.name}`,
                `Индекс урока: ${lessonIndex}`,
                `Айди дня: ${data.id}`,
                `Айди недели: ${data.weekId}`,
            ]);
        }

        await showToggleLessonChoose(ctx, data);

    }
};
