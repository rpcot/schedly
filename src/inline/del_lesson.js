const { InlineKeyboard } = require("grammy");
const { getDayScheduleById, showManageDay } = require("../utils/schedule-functions");
const { Days } = require("../models");
const { sendActionLog } = require("../utils/logging-functions");

module.exports = {
    data: 'del_lesson',
    async execute(bot, ctx, userId, dataId, lessonIndex, confirm) {
        const data = await getDayScheduleById(dataId);
        
        lessonIndex = parseInt(lessonIndex);
        
        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        } else {
            await ctx.answerCallbackQuery();
        }

        const lessonName = data.lessons[lessonIndex].name;

        if (confirm) {
            data.lessons.splice(lessonIndex, 1);
            await Days.update({ lessons: data.lessons }, { where: { id: data.id } });

            await showManageDay(ctx, data.weekId, data.index);

            await sendActionLog(ctx, 'Удаление урока', [
                `Урок: ${lessonName}`,
                `Айди дня: ${data.id}`,
                `Айди недели: ${data.weekId}`,
            ]);
        } else {
            const inline = new InlineKeyboard()
                .text('Удалить', `del_lesson?:${ctx.from.id}?:${dataId}?:${lessonIndex}?:confirm`)
                .text('Отмена', `back_manage_day?:${ctx.from.id}?:${dataId}`);

            await ctx.editMessageText(`Вы уверены, что хотите удалить урок ${lessonName}?\nВместе с ним будет удалена и домашнее задание, заданное на него.`, {
                reply_markup: inline,
            });
        }
    }
};
