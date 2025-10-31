const { Days } = require("../models");
const { sendActionLog, sendDisableLessonTodayLog } = require("../utils/logging-functions");
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
            const targetLessonData = data.lessons[parseInt(lessonIndex)];
            
            targetLessonData.canceled = !targetLessonData.canceled;
            await Days.update({ lessons: data.lessons }, { where: { id: data.id } });
            
            const lessonData = targetLessonData;
            
            await sendActionLog(ctx, 'Изменён статус урока', [
                `Новое значение: ${(lessonData.canceled) ? 'Отменён' : 'По умолчанию'}`,
                `Урок: ${lessonData.name}`,
                `Индекс урока: ${lessonIndex}`,
                `День: ${data.date}`,
                `Айди дня: ${data.id}`,
                `Айди недели: ${data.weekId}`,
            ]);

            if (
                targetLessonData.canceled &&
                data.date === new Date().toLocaleDateString('ru-RU')
            ) {
                await sendDisableLessonTodayLog(ctx, targetLessonData, parseInt(lessonIndex) + 1);
            }
        }

        await showToggleLessonChoose(ctx, data);

    }
};
