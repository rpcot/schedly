const { InlineKeyboard } = require("grammy");
const { getDayScheduleById, showManageDay } = require("../utils/schedule-functions");
const { getAttachment } = require("../utils/attachments-functions");
const { sendActionLog } = require("../utils/logging-functions");

module.exports = {
    data: 'del_attachment',
    async execute(bot, ctx, userId, dataId, lessonIndex, attachmentIndex) {
        lessonIndex = parseInt(lessonIndex);
        attachmentIndex = parseInt(attachmentIndex);

        const data = await getDayScheduleById(dataId);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        }

        const lessonData = data.lessons[lessonIndex];

        if (!isNaN(attachmentIndex)) {
            const attachment = lessonData?.attachments?.[attachmentIndex];
            const attachmentData = await getAttachment(attachment?.id);

            if (!attachmentData)
                return void ctx.answerCallbackQuery('Вложение не найдено.');

            await ctx.answerCallbackQuery();

            lessonData.attachments.splice(attachmentIndex, 1);
            data.changed('lessons', true);
            await data.save();

            await attachmentData.destroy();

            await showManageDay(ctx, data.weekId, data.index);

            await sendActionLog(ctx, 'Удалено вложение', [
                `Значение: ${JSON.stringify(attachmentData.value, null, 2)}`,
                `Урок: ${lessonData.name}`,
                `Индекс урока: ${lessonIndex}`,
                `Айди дня: ${data.id}`,
                `Айди недели: ${data.weekId}`,
            ]);
        } else {
            const attachmentsCount = lessonData?.attachments?.length || 0;
            if (attachmentsCount === 0)
                return void await ctx.answerCallbackQuery('У данного урока нет вложений.');

            await ctx.answerCallbackQuery();

            const inline = new InlineKeyboard();

            let index = 0;
            for (const attachment of lessonData.attachments) {
                inline
                    .text(attachment.name || `Вложение ${index + 1}`, `del_attachment?:${userId}?:${dataId}?:${lessonIndex}?:${index}`)
                    .row();
                index++;
            }

            inline.text('Вернуться', `choose_lesson?:${userId}?:${dataId}?:del_attachment`);

            await ctx.editMessageText('Выбери вложение, которое ты хочешь удалить:', {
                reply_markup: inline,
            });
        }
    }
};