const { loggingChannelId, generalChannelId, dayNames } = require('../config');

async function sendActionLog(ctx, text, params = []) {
    const bot = require('../index');

    try {
        const author = ctx.from.username || `${ctx.from.first_name} ${ctx.from.last_name}`;

        const messageText = `<b>${author} <code>${ctx.from.id}</code> ${new Date().toLocaleString('ru-RU')}</b>
        ${text}
        ${params.join('\n')}
        `.replace(/  +/g, '');

        await ctx.api.sendMessage(loggingChannelId, messageText, {
            parse_mode: 'HTML',
        });
    } catch (error) {
        bot.logger.error(`Возникла ошибка при логировании:\n${error.stack}\n`, { ctx, text, params });
    }

}

async function sendChangeCabinetTodayLog(ctx, lessonData, oldCabinet) {
    const bot = require('../index');

    try {
        const text = `‼️ Урок <b>${lessonData.name}</b> перенесен в кабинет <b>${lessonData.cabinet}</b> (ранее: ${oldCabinet})`

        await ctx.api.sendMessage(generalChannelId, text, {
            parse_mode: 'HTML',
        });
    } catch (error) {
        bot.logger.error(`Возникла ошибка при отправке оповещения о изменении кабинета:\n${error.stack}`, { ctx, lesson, oldCabinet })
    }
}

async function sendChangeDayNoteLog(ctx, day) {
    const bot = require('../index');

    try {
        const text = `🔖 Добавлено примечание на <b>${dayNames[day.index]}</b> (<b>${day.date}</b>):
        <b>${day.note}</b>`.replace(/  +/g, '');

        await ctx.api.sendMessage(generalChannelId, text, {
            parse_mode: 'HTML',
        });
    } catch (error) {
        bot.logger.error(`Возникла ошибка при отправке оповещения о добавлении примечания на день:\n${error.stack}`, { ctx, day })
    }
}

module.exports = {
    sendActionLog,
    sendChangeCabinetTodayLog,
    sendChangeDayNoteLog,
};
