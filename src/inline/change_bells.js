const { InlineKeyboard } = require("grammy");
const { getDayScheduleById, getDefaultBells, showManageDay } = require("../utils/schedule-functions");
const { sendActionLog } = require("../utils/logging-functions");

module.exports = {
    data: 'change_bells',
    async execute(bot, ctx, userId, dataId, newType) {
        const data = await getDayScheduleById(dataId);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        } else {
            await ctx.answerCallbackQuery();
        }

        if (newType) {
            data.bellsType = newType;
            await data.save();

            await showManageDay(ctx, data.weekId, data.index);

            await sendActionLog(ctx, 'Изменен тип звонков', [
                `Новый тип: ${newType}`,
                `Айди дня: ${data.id}`,
                `Айди недели: ${data.weekId}`,
            ]);
        } else {
            const bells = getDefaultBells();

            const inline = new InlineKeyboard();

            let count = 1;
            for (const bell of Object.values(bells)) {
                if (bell.id !== data.bellsType) {
                    inline.text(bell.name, `change_bells?:${ctx.from.id}?:${dataId}?:${bell.id}`);

                    if (count % 2 === 0) {
                        inline.row();
                    }
                    count++;
                }
            }

            if (count % 2 !== 1) {
                inline.row();
            }

            inline.text('Вернуться', `back_manage_day?:${ctx.from.id}?:${dataId}`)

            await ctx.editMessageText(`Выбери новый тип звонков`, {
                reply_markup: inline,
            });
        }
    }
};
