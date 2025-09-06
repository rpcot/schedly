const { InlineKeyboard } = require("grammy");
const { getDayScheduleById, getSubgroups } = require("../utils/schedule-functions");
const { setWait } = require("../utils/users-functions");

module.exports = {
    data: 'add_homework',
    async execute(bot, ctx, userId, dataId, lessonIndex, teacherId) {

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

        const lessonData = data.lessons[lessonIndex];
        const subgroups = getSubgroups();

        if (Object.keys(subgroups.lessons).includes(lessonData.name) && !teacherId) {
            const inline = new InlineKeyboard();

            const teachers = subgroups.lessons[lessonData.name];
            for (const teacherId of teachers) {
                inline
                    .text(`Группа ${subgroups.teachers[teacherId]}`, `add_homework?:${userId}?:${dataId}?:${lessonIndex}?:${teacherId}`);
            }

            inline
                .row()
                .text('Отменить', `back_manage_day?:${userId}?:${dataId}`);
            
            await ctx.editMessageText(`Выберите <b>группу</b>, для которой вы хотите добавить <b>домашнее задание</b> на урок ${lessonData.name}`, {
                parse_mode: 'HTML',
                reply_markup: inline,
            });
        } else {
            const inline = new InlineKeyboard()
                .text('Отменить', `back_manage_day?:${userId}?:${dataId}`);

            await setWait(ctx.from.id, { id: 'add_homework', dataId, lessonIndex, editMessageId: ctx.msg.message_id, teacherId });

            await ctx.editMessageText(`Напиши содержание домашнего задания для ${lessonIndex + 1} урока ${data.lessons[lessonIndex].name}`, {
                reply_markup: inline,
            });
        }

    }
};
