const { Days } = require("../models");
const { sendActionLog } = require("../utils/logging-functions");
const { showLessonChoose, getDayScheduleById, showManageDay } = require("../utils/schedule-functions");

module.exports = {
    data: 'move_lesson',
    async execute(bot, ctx, userId, dataId, firstLessonIndex, secondLessonIndex) {

        const data = await getDayScheduleById(dataId);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        } else {
            await ctx.answerCallbackQuery();
        }

        if (secondLessonIndex) {
            const firstLessonData = data.lessons[parseInt(firstLessonIndex)];
            const secondLessonData = data.lessons[parseInt(secondLessonIndex)];
            
            data.lessons.splice(parseInt(firstLessonIndex), 1, secondLessonData);
            data.lessons.splice(parseInt(secondLessonIndex), 1, firstLessonData);
            await Days.update({ lessons: data.lessons }, { where: { id: data.id } });

            await showManageDay(ctx, data.weekId, data.index);

            await sendActionLog(ctx, 'Предмет перемещён', [
                `${firstLessonData.name} -> ${secondLessonData.name}`,
                `День: ${data.date}`,
                `Айди дня: ${data.id}`,
                `Айди недели: ${data.weekId}`,
            ]);
        } else if (firstLessonIndex) {
            const firstLessonData = data.lessons[parseInt(firstLessonIndex)];
            await showLessonChoose(ctx, data, 'move_lesson', {
                text: `Выбери урок, на который ты хочешь заменить ${parseInt(firstLessonIndex) + 1} урок ${firstLessonData.name}:`,
                args: firstLessonIndex,
                exceptions: [parseInt(firstLessonIndex)],
            });
        } else {
            await showLessonChoose(ctx, data, 'move_lesson', {
                text: `Выбери урок, который ты хочешь заменить:`,
            });
        }

    } 
};
