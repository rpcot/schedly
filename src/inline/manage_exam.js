const { InlineKeyboard } = require("grammy");
const { getDayScheduleById, showManageDay } = require("../utils/schedule-functions");
const { setWait } = require("../utils/users-functions");
const { Days } = require("../models");
const { sendActionLog } = require("../utils/logging-functions");

module.exports = {
    data: 'manage_exam',
    async execute(bot, ctx, userId, dataId, lessonIndex, action) {

        const data = await getDayScheduleById(dataId);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        } else {
            await ctx.answerCallbackQuery();
        }

        if (action === 'delete') {
            await setWait(ctx.from.id, {});

            const examText = data.lessons[parseInt(lessonIndex)].exam;

            data.lessons[parseInt(lessonIndex)].exam = '';
            await Days.update({ lessons: data.lessons }, { where: { id: data.id } });

            await showManageDay(ctx, data.weekId, data.index);

            const lessonData = data.lessons[parseInt(lessonIndex)];

            await sendActionLog(ctx, 'Удалена проверочная работа', [
                `Текст: ${examText}`,
                `Урок: ${lessonData.name}`,
                `Индекс урока: ${lessonIndex}`,
                `Айди дня: ${data.id}`,
                `Айди недели: ${data.weekId}`,
            ]);
        } else {
            const inline = new InlineKeyboard()
                .text('Удалить проверочную', `manage_exam?:${userId}?:${dataId}?:${lessonIndex}?:delete`)
                .row()
                .text('Отменить', `back_manage_day?:${userId}?:${dataId}`);

            await setWait(ctx.from.id, { id: 'add_exam', dataId, lessonIndex: parseInt(lessonIndex), editMessageId: ctx.msg.message_id });
            
            await ctx.editMessageText('Напиши темы проверочной, где их можно найти (например, страница в учебнике) и всю остальную необходимую информацию', {
                reply_markup: inline,
            });
        }

    }
};
