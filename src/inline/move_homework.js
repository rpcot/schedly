const { InlineKeyboard } = require("grammy");
const { getDayScheduleById, showManageDay, getLastThreeWeeks, getDaySchedule, getWeekById, showLessonChoose } = require("../utils/schedule-functions");
const { Days } = require("../models");
const { sendActionLog } = require("../utils/logging-functions");

module.exports = {
    data: 'move_homework',
    async execute(bot, ctx, userId, dataId, lessonIndex, homeworkIndex, weekId, dayOfWeek, targetLessonId) {
        const data = await getDayScheduleById(dataId);

        lessonIndex = parseInt(lessonIndex);
        targetLessonId = parseInt(targetLessonId);
        homeworkIndex = (homeworkIndex === 'all')
            ? 'all'
            : parseInt(homeworkIndex);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        } else if (homeworkIndex && isNaN(targetLessonId)) {
            await ctx.answerCallbackQuery();
        }

        if (!isNaN(targetLessonId)) {
            const targetData = (data.weekId === weekId && data.index === dayOfWeek)
                ? data
                : await getDaySchedule(dayOfWeek, weekId);

            const currentLesson = data.lessons[lessonIndex];
            const targetLesson = targetData.lessons[targetLessonId];

            if (currentLesson.name === targetLesson.name && data.id === targetData.id)
                return void await ctx.answerCallbackQuery('Невозможно перенести домашнее задание на тот же урок');

            const homeworkToMove = (homeworkIndex === 'all')
                ? currentLesson.homework
                : [currentLesson.homework[homeworkIndex]];

            if (targetLesson.homework.length + homeworkToMove.length > 3)
                return void await ctx.answerCallbackQuery('Невозможно добавить больше 3-х домашних заданий');

            if (data.id === targetData.id) {
                const lessons = [];
                for (const lesson of data.lessons) {
                    if (lesson.name === targetLesson.name) {
                        if (homeworkIndex === 'all') {
                            const newHomework = lesson.homework.concat(homeworkToMove);
                            lesson.homework = newHomework;
                        } else {
                            lesson.homework.push(homeworkToMove[0]);
                        }
                    } else if (lesson.name === currentLesson.name) {
                        if (homeworkIndex === 'all') {
                            lesson.homework = [];
                        } else {
                            lesson.homework.splice(homeworkIndex, 1);
                        }
                    }

                    lessons.push(lesson);
                }

                await Days.update({ lessons }, { where: { id: data.id } });
            } else {
                const newLessons = [];
                for (const lesson of data.lessons) {
                    if (lesson.name === currentLesson.name) {
                        if (homeworkIndex === 'all') {
                            lesson.homework = [];
                        } else {
                            lesson.homework.splice(homeworkIndex, 1);
                        }
                    }

                    newLessons.push(lesson);
                }

                const newTargetLessons = [];
                for (const lesson of targetData.lessons) {
                    if (lesson.name === targetLesson.name) {
                        if (homeworkIndex === 'all') {
                            lesson.homework = homeworkToMove;
                        } else {
                            lesson.homework.push(homeworkToMove[0]);
                        }
                    }

                    newTargetLessons.push(lesson);
                }

                await Days.update({ lessons: newLessons }, { where: { id: data.id } });
                await Days.update({ lessons: newTargetLessons }, { where: { id: targetData.id } });
            }

            await sendActionLog(ctx, 'Перенос домашнего задания', [
                `Индекс урока: ${lessonIndex}`,
                `Индекс домашнего задания: ${homeworkIndex}`,
                `Индекс таргетного урока: ${targetLessonId}`,
                `Индекс дня: ${dayOfWeek}`,
                `День: ${data.date}`,
                `Айди дня: ${dataId}`,
                `Айди недели: ${weekId}`,
                `Перенесенное домашнее задание:\n${homeworkToMove.join('\n')}`,
            ])

            await showManageDay(ctx, targetData.weekId, targetData.index);
        } else if (dayOfWeek !== undefined && dayOfWeek !== NaN) {
            const targetData = await getDaySchedule(dayOfWeek, weekId);

            await showLessonChoose(ctx, targetData, 'move_homework', {
                text: 'Выбери урок, на который ты хочешь перенести домашнее задание',
                args: `${lessonIndex}?:${homeworkIndex}?:${weekId}?:${dayOfWeek}`,
                dataId,
            });
        } else if (weekId) {
            const week = await getWeekById(weekId);

            const inline = new InlineKeyboard()
                .text('Понедельник', `move_homework?:${ctx.from.id}?:${dataId}?:${lessonIndex}?:${homeworkIndex}?:${weekId}?:0`)
                .text('Вторник', `move_homework?:${ctx.from.id}?:${dataId}?:${lessonIndex}?:${homeworkIndex}?:${weekId}?:1`)
                .row()
                .text('Среда', `move_homework?:${ctx.from.id}?:${dataId}?:${lessonIndex}?:${homeworkIndex}?:${weekId}?:2`)
                .text('Четверг', `move_homework?:${ctx.from.id}?:${dataId}?:${lessonIndex}?:${homeworkIndex}?:${weekId}?:3`)
                .row()
                .text('Пятница', `move_homework?:${ctx.from.id}?:${dataId}?:${lessonIndex}?:${homeworkIndex}?:${weekId}?:4`)
                .text('Суббота', `move_homework?:${ctx.from.id}?:${dataId}?:${lessonIndex}?:${homeworkIndex}?:${weekId}?:5`)
                .row()
                .text('Вернуться к выбору недели', `move_homework?:${ctx.from.id}?:${dataId}?:${lessonIndex}?:${homeworkIndex}`)
                .row()
                .text('Вернуться', `back_manage_day?:${ctx.from.id}?:${dataId}`);

            await ctx.editMessageText(`Выбери день недели ${week.date}:`, {
                reply_markup: inline,
            });
        } else if (!isNaN(homeworkIndex) || homeworkIndex === 'all') {
            const weeks = await getLastThreeWeeks();

            const inline = new InlineKeyboard()
                .text('Текущая', `move_homework?:${ctx.from.id}?:${dataId}?:${lessonIndex}?:${homeworkIndex}?:${weeks[0].id}`)
                .row()
                .text('Следующая', `move_homework?:${ctx.from.id}?:${dataId}?:${lessonIndex}?:${homeworkIndex}?:${weeks[1].id}`)
                .row()
                .text('Через две', `move_homework?:${ctx.from.id}?:${dataId}?:${lessonIndex}?:${homeworkIndex}?:${weeks[2].id}`)
                .row()
                .text('Вернуться', `back_manage_day?:${ctx.from.id}?:${dataId}`);

            await ctx.editMessageText('Выбери неделю, куда ты хочешь перенести домашнее задание', {
                reply_markup: inline,
            });
        } else {
            const lesson = data.lessons[lessonIndex];

            if (lesson.homework.length === 0)
                return void await ctx.answerCallbackQuery('Для данного урока не указано домашнее задание');

            const inline = new InlineKeyboard();

            let index = 0;
            for (const homework of lesson.homework) {
                inline
                    .text(homework, `move_homework?:${ctx.from.id}?:${dataId}?:${lessonIndex}?:${index}`)
                    .row();

                index++;
            }

            inline
                .text('Выбрать все', `move_homework?:${ctx.from.id}?:${dataId}?:${lessonIndex}?:all`)
                .row()
                .text('Вернуться', `back_manage_day?:${ctx.from.id}?:${dataId}`);

            await ctx.editMessageText('Выбери домашнее задание, которое ты хочешь перенести', {
                reply_markup: inline,
            });
        }
    }
};
