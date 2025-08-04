const { InlineKeyboard } = require("grammy");
const { getDayScheduleById } = require("../utils/schedule-functions");
const { setWait } = require("../utils/users-functions");

module.exports = {
    data: 'add_homework',
    async execute(bot, ctx, userId, dataId, lessonIndex) {

        lessonIndex = parseInt(lessonIndex);

        const data = await getDayScheduleById(dataId);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        } else if (data.lessons[lessonIndex].homework.length >= 3) {
            return void await ctx.answerCallbackQuery('Для данного урока достигнуто максимальное количество домашних заданий.');
        } else {
            await ctx.answerCallbackQuery();
        }

        const inline = new InlineKeyboard()
            .text('Отменить', `back_manage_day?:${userId}?:${dataId}`);

        await setWait(ctx.from.id, { id: 'add_homework', dataId, lessonIndex, editMessageId: ctx.msg.message_id });
        
        await ctx.editMessageText(`Напиши содержание домашнего задания для ${lessonIndex + 1} урока ${data.lessons[lessonIndex].name}`, {
            reply_markup: inline,
        });

    }
};
