const { InlineKeyboard } = require("grammy");
const { getDayScheduleById, showManageDay } = require("../utils/schedule-functions");
const { Days } = require("../models");
const { sendActionLog } = require("../utils/logging-functions");

module.exports = {
    data: 'del_homework',
    async execute(bot, ctx, userId, dataId, lessonIndex, homeworkIndex) {

        lessonIndex = parseInt(lessonIndex);

        const data = await getDayScheduleById(dataId);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        }

        if (homeworkIndex) {
            await ctx.answerCallbackQuery();

            const lessonData = data.lessons[lessonIndex];
            const homeworkData = data.lessons[lessonIndex].homework[parseInt(homeworkIndex)];

            let index = 0;
            for (const lesson of data.lessons) {
                if (lesson.name === lessonData.name && lesson.homework.includes(homeworkData)) {
                    const indexHomework = lesson.homework.indexOf(homeworkData);
                    lesson.homework.splice(indexHomework, 1);
                    data.lessons.splice(index, 1, lesson);
                }
                index++;
            }
            await Days.update({ lessons: data.lessons }, { where: { id: data.id } });

            await showManageDay(ctx, data.weekId, data.index);

            await sendActionLog(ctx, 'Удалено домашнее задание', [
                `Текст: ${homeworkData}`,
                `Урок: ${lessonData.name}`,
                `Индекс урока: ${lessonIndex}`,
                `День: ${data.date}`,
                `Айди дня: ${data.id}`,
                `Айди недели: ${data.weekId}`,
            ]);
        } else {
            const homeworks = data.lessons[lessonIndex].homework;
            if (homeworks.length === 0)
                return void await ctx.answerCallbackQuery('Для данного урока не указано домашнее задание');

            await ctx.answerCallbackQuery();

            const inline = new InlineKeyboard();
            
            let index = 0;
            for (const homework of homeworks) {
                inline
                    .text(homework, `del_homework?:${userId}?:${dataId}?:${lessonIndex}?:${index}`)
                    .row();
                index++;
            }

            inline.text('Вернуться', `choose_lesson?:${userId}?:${dataId}?:del_homework`);

            await ctx.editMessageText('Выбери домашнее задание, которое ты хочешь удалить:', {
                reply_markup: inline,
            });
        }

    }
};
