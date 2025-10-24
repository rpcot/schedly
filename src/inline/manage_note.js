const { InlineKeyboard } = require("grammy");
const { getDayScheduleById, showManageDay } = require("../utils/schedule-functions");
const { setWait } = require("../utils/users-functions");
const { sendActionLog } = require("../utils/logging-functions");

module.exports = {
    data: 'manage_note',
    async execute(bot, ctx, userId, dataId, action) {

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

            const noteText = data.note;

            data.note = '';
            await data.save();

            await showManageDay(ctx, data.weekId, data.index);

            await sendActionLog(ctx, 'Удалено примечание', [
                `Текст: ${noteText}`,
                `День: ${data.date}`,
                `Айди дня: ${data.id}`,
                `Айди недели: ${data.weekId}`,
            ]);
        } else {
            const inline = new InlineKeyboard()
                .text('Удалить примечание', `manage_note?:${userId}?:${dataId}?:delete`)
                .row()
                .text('Отменить', `back_manage_day?:${userId}?:${dataId}`);

            await setWait(ctx.from.id, { id: 'add_note', dataId, editMessageId: ctx.msg.message_id });
            
            await ctx.editMessageText('Напиши примечание для дня или удалите его с помощью кнопки внизу', {
                reply_markup: inline,
            });
        }

    }
};
