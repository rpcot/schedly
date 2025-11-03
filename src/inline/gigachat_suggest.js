const { getChatMember } = require("../utils/chat-functions");
const { getSuggestById, generateGigaChatSuggestStringView, setSuggestStatusById } = require("../utils/gigachat-functions");
const { sendGigaChatActionLog, sendAddExamLog, sendGigaChatSuggestDecline } = require("../utils/logging-functions");
const { getDayScheduleById, getSubgroups, generateSelectTeacherIdInline, addHomeworkToLesson, addExamToLesson } = require("../utils/schedule-functions");

module.exports = {
    data: 'gigachat_suggest',
    async execute(bot, ctx, action, suggestId, teacherId) {
        const suggestData = await getSuggestById(suggestId);
        if (!suggestData)
            return void await ctx.answerCallbackQuery('Предложение от GigaChat не найдено или было удалено');

        const targetDay = await getDayScheduleById(suggestData.targetDayId);
        if (!targetDay)
            return void await ctx.answerCallbackQuery('День, к которому относится предложение от GigaChat, не найден');

        switch (action) {
            case 'decline': {
                await ctx.deleteMessage()
                    .catch(() => { });
                await sendGigaChatSuggestDecline(ctx, targetDay, suggestData, ctx.from);
                await setSuggestStatusById(suggestData.id, 'declined');
                break;
            }
            case 'accept': {
                const targetLesson = targetDay.lessons[suggestData.targetLessonIndex];

                const subgroups = getSubgroups();

                let text = generateGigaChatSuggestStringView(targetDay, targetLesson, suggestData.type, suggestData.value);

                switch (suggestData.type) {
                    case 'homework': {
                        if (
                            Object.keys(subgroups.lessons).includes(targetLesson.name) &&
                            !teacherId
                        ) {
                            const inline = generateSelectTeacherIdInline(
                                targetLesson.name,
                                `gigachat_suggest?:accept?:${suggestId}?:[teacherId]`,
                                `gigachat_suggest?:decline?:${suggestId}`,
                            );

                            text += `\n\nВыберите <b>группу</b>, для которой вы хотите добавить <b>домашнее задание</b> на урок ${targetLesson.name}`;

                            await ctx.editMessageText(text, {
                                parse_mode: 'HTML',
                                reply_markup: inline,
                            });
                        } else {
                            if (targetLesson.homework.length >= 3)
                                return void await ctx.answerCallbackQuery(`Для данного урока достигнуто максимальное количество домашних заданий`);

                            await addHomeworkToLesson(targetDay, suggestData.targetLessonIndex, suggestData.value, { teacherId: teacherId });

                            text += '\n\n<b>Домашнее задание добавлено</b>';

                            await ctx.editMessageText(text, {
                                parse_mode: 'HTML',
                                reply_markup: null,
                            });
                        }

                        await sendGigaChatActionLog(ctx, 'Добавлено домашнее задание', suggestData.id, ctx.from, [
                            `Текст: ${suggestData.value.slice(0, 110)}`,
                            `Урок: ${targetLesson.name}`,
                            `Индекс урока: ${suggestData.targetLessonIndex}`,
                            `День: ${targetDay.date}`,
                            `Айди дня: ${targetDay.id}`,
                            `Айди недели: ${targetDay.weekId}`,
                        ]);

                        await setSuggestStatusById(suggestData.id, 'accepted');

                        break;
                    }
                    case 'exam': {
                        await addExamToLesson(targetDay, suggestData.targetLessonIndex, suggestData.value);

                        text += '\n\n<b>Проверочная работа добавлена</b>';

                        await ctx.editMessageText(text, {
                            parse_mode: 'HTML',
                            reply_markup: null,
                        });

                        await sendGigaChatActionLog(ctx, 'Добавлена проверочная работа', suggestData.id, ctx.from, [
                            `Текст: ${suggestData.value.slice(0, 100)}`,
                            `Урок: ${targetLesson.name}`,
                            `Индекс урока: ${suggestData.targetLessonIndex}`,
                            `День: ${targetDay.date}`,
                            `Айди дня: ${targetDay.id}`,
                            `Айди недели: ${targetDay.weekId}`,
                        ]);

                        await sendAddExamLog(ctx, targetLesson, targetDay, suggestData.targetLessonIndex + 1);

                        await setSuggestStatusById(suggestData.id, 'accepted');

                        break;
                    }
                }
            }
        }
    }
};
