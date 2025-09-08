const { InlineKeyboard } = require("grammy");
const { getDayScheduleById } = require("../utils/schedule-functions");
const { setWait } = require("../utils/users-functions");

module.exports = {
    data: 'add_attachment',
    async execute(bot, ctx, userId, dataId, lessonIndex, skip) {
        lessonIndex = parseInt(lessonIndex);

        const data = await getDayScheduleById(dataId);
        const attachmentsCount = data.lessons[lessonIndex]?.attachments?.length || 0;

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        } else if (attachmentsCount >= 5) {
            return void await ctx.answerCallbackQuery('Для данного урока достигнуто максимальное количество вложений.');
        } else {
            await ctx.answerCallbackQuery();
        }

        if (skip) {
            const inline = new InlineKeyboard()
                .text('Отменить', `back_manage_day?:${userId}?:${dataId}`);

            await setWait(ctx.from.id, { id: 'add_attachment', dataId, lessonIndex, editMessageId: ctx.msg.message_id, attachmentName: null });

            const text = `Отправь вложение для ${lessonIndex + 1} урока ${data.lessons[lessonIndex].name}
            Это может быть видео, аудио, фото, файл, гифка, кружок, гс или ссылка на какой-то ресурс.
            `.replace(/  +/g, '');

            await ctx.editMessageText(text, {
                reply_markup: inline,
            });
        } else {
            const inline = new InlineKeyboard()
                .text('Пропустить', `add_attachment?:${userId}?:${dataId}?:${lessonIndex}?:skip`)
                .row()
                .text('Отменить', `back_manage_day?:${userId}?:${dataId}`);

            await setWait(ctx.from.id, { id: 'add_attachment_name', dataId, lessonIndex, editMessageId: ctx.msg.message_id });

            const text = `Назови вложение для ${lessonIndex + 1} урока ${data.lessons[lessonIndex].name} (Например, фотография таблицы или видео-урок)
            `.replace(/  +/g, '');

            await ctx.editMessageText(text, {
                reply_markup: inline,
            });
        }
    }
};
