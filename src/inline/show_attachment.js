const { InlineKeyboard } = require("grammy");
const { getDayScheduleById, showLessonChoose } = require("../utils/schedule-functions");
const { showAttachment } = require("../utils/attachments-functions");

module.exports = {
    data: 'show_attachment',
    async execute(bot, ctx, userId, dataId, isAdmin, lessonIndex, attachmentId) {
        lessonIndex = parseInt(lessonIndex);
        isAdmin = isAdmin === 'true';

        const data = await getDayScheduleById(dataId);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        }

        const lessonData = data.lessons[lessonIndex];

        const backInlineId = (isAdmin)
            ? `back_manage_day?:${userId}?:${dataId}`
            : `back_show_day?:${userId}?:${dataId}`;

        if (attachmentId) {
            await ctx.answerCallbackQuery();

            await showAttachment(ctx, lessonData, attachmentId);
        } else if (!isNaN(lessonIndex)) {
            if (!lessonData.attachments?.length)
                return void ctx.answerCallbackQuery('У данного урока нет вложений.');

            await ctx.answerCallbackQuery();

            const inline = new InlineKeyboard();
            let num = 1;
            for (const attachment of lessonData.attachments) {
                const attachmentName = attachment.name || `Вложение ${num}`;
                inline
                    .text(attachmentName, `show_attachment?:${userId}?:${dataId}?:${isAdmin}?:${lessonIndex}?:${attachment.id}`)
                    .row();

                num++;
            }

            inline.text('Отменить', `${backInlineId}?:${userId}?:${dataId}`);

            await ctx.editMessageText(`Выберите вложение, которое вы хотите посмотреть`, {
                reply_markup: inline,
            });
        } else {
            await showLessonChoose(ctx, data, 'show_attachment', {
                text: 'Выберите урок, вложения которого вы хотите посмотреть:',
                backInlineId,
                args: isAdmin,
            });
        }
    },
};
