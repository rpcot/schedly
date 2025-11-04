const { InlineKeyboard } = require("grammy");
const { getDefaultLessons, getDayScheduleById, showManageDay } = require("../utils/schedule-functions");
const { Days } = require("../models");
const { sendActionLog } = require("../utils/logging-functions");

module.exports = {
    data: 'add_lesson',
    async execute(bot, ctx, userId, dataId, lessonPosition, newLessonId) {
        const data = await getDayScheduleById(dataId);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        } else if (data.lessons.length >= 8) {
            return void await ctx.answerCallbackQuery('Достигнуто максимальное количество уроков в расписании');
        } else {
            await ctx.answerCallbackQuery();
        }

        if (newLessonId) {
            const lessons = getDefaultLessons();
            const lesson = lessons.find((lessonData) => lessonData.id === newLessonId);
            
            const sameLesson = data.lessons.find((lessonData) => lessonData.name === lesson.name);

            const lessonData = {
                name: lesson.name,
                exam: "",
                cabinet: lesson.cabinet || 'Не указан',
                homework: sameLesson?.homework || [],
                attachments: sameLesson?.attachments || [],
                canceled: lesson.canceled ?? false,
            };

            data.lessons.splice(lessonPosition, 0, lessonData);
            await Days.update({ lessons: data.lessons }, { where: { id: data.id } });

            await showManageDay(ctx, data.weekId, data.index);

            await sendActionLog(ctx, 'Добавление урока', [
                `Урок: ${newLessonId}`,
                `Позиция: ${lessonPosition + 1}`,
                `День: ${data.date}`,
                `Айди дня: ${data.id}`,
                `Айди недели: ${data.weekId}`,
            ]);
        } else if (lessonPosition) {
            const lessons = getDefaultLessons();

            const inline = new InlineKeyboard();

            let count = 1;
            for (const lesson of lessons) {
                inline.text(lesson.name, `add_lesson?:${ctx.from.id}?:${dataId}?:${lessonPosition}?:${lesson.id}`);

                if (count % 2 === 0) {
                    inline.row();
                }
                count++;
            }

            if (count % 2 !== 1) {
                inline.row();
            }

            inline.text('Вернуться', `back_manage_day?:${ctx.from.id}?:${data.id}`);

            await ctx.editMessageText('Выбери урок, который вы хотите добавить', {
                reply_markup: inline,
            });
        } else {
            const inline = new InlineKeyboard()
                .text('1', `add_lesson?:${ctx.from.id}?:${dataId}?:0`)
                .text('2', `add_lesson?:${ctx.from.id}?:${dataId}?:1`)
                .row()
                .text('3', `add_lesson?:${ctx.from.id}?:${dataId}?:2`)
                .text('4', `add_lesson?:${ctx.from.id}?:${dataId}?:3`)
                .row()
                .text('5', `add_lesson?:${ctx.from.id}?:${dataId}?:4`)
                .text('6', `add_lesson?:${ctx.from.id}?:${dataId}?:5`)
                .row()
                .text('7', `add_lesson?:${ctx.from.id}?:${dataId}?:6`)
                .text('8', `add_lesson?:${ctx.from.id}?:${dataId}?:7`)
                .row()
                .text('Вернуться', `back_manage_day?:${ctx.from.id}?:${data.id}`);

            await ctx.editMessageText('Выбери номер, куда вы хотите добавить урок', {
                reply_markup: inline,
            });
        }
    }
};
