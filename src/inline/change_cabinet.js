const { InlineKeyboard } = require("grammy");
const { Days } = require("../models");
const { getDayScheduleById, showManageDay } = require("../utils/schedule-functions");
const { sendActionLog, sendChangeCabinetTodayLog } = require("../utils/logging-functions");

module.exports = {
    data: 'change_cabinet',
    async execute(bot, ctx, userId, dataId, lessonIndex, newCabinet) {

        const data = await getDayScheduleById(dataId);

        if (parseInt(userId) !== ctx.from.id) {
            return void await ctx.answerCallbackQuery('Вы не можете взаимодействовать с чужими кнопками');
        } else if (!data) {
            return void await ctx.answerCallbackQuery('Информация о выбранном дне не найдена. Пропиши команду ещё раз');
        } else {
            await ctx.answerCallbackQuery();
        }

        if (newCabinet) {
            const oldCabinet = data.lessons[parseInt(lessonIndex)].cabinet;

            data.lessons[parseInt(lessonIndex)].cabinet = (newCabinet === '{english}')
                ? '3/возле актового зала'
                : newCabinet;
            await Days.update({ lessons: data.lessons }, { where: { id: data.id } });
            await showManageDay(ctx, data.weekId, data.index);

            const lessonData = data.lessons[parseInt(lessonIndex)];

            if (data.date === new Date().toLocaleDateString('ru-RU')) {
                await sendChangeCabinetTodayLog(ctx, lessonData, oldCabinet, parseInt(lessonIndex) + 1);
            }

            await sendActionLog(ctx, 'Изменён кабинет', [
                `Старый кабинет: ${oldCabinet}`,
                `Новый кабинет: ${newCabinet}`,
                `Урок: ${lessonData.name}`,
                `Индекс урока: ${lessonIndex}`,
                `День: ${data.date}`,
                `Айди дня: ${data.id}`,
                `Айди недели: ${data.weekId}`,
            ]);
        } else {
            const inline = new InlineKeyboard();

            const cabinets = [
                1, 2, '3а', '3б', '4а', '4б', 5, 6, 7, 8, 9, 10,
                11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
                31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
                41, 42, 43, 44, 45, 46, 47, 48, 49, 'Спортзал',
                '2/4', '21/37', '{english}',
            ];

            let count = 1;
            for (const cabinet of cabinets) {
                if (cabinet === '{english}') {
                    inline.text(`3/возле актового зала`, `change_cabinet?:${userId}?:${dataId}?:${lessonIndex}?:${cabinet}`);
                } else {
                    inline.text(`${cabinet}`, `change_cabinet?:${userId}?:${dataId}?:${lessonIndex}?:${cabinet}`);
                }
                if (count % 5 === 0) {
                    inline.row();
                }
                count++;
            }

            inline
                .row()
                .text('Вернуться', `choose_lesson?:${userId}?:${dataId}?:change_cabinet`);

            await ctx.editMessageText('Выбери новый кабинет:', {
                reply_markup: inline,
            });
        }

    }
};
