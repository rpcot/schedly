const { loggingChannelId } = require('../config');

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
    } catch(error) {
        bot.logger.error(`Возникла ошибка при логировании:\n${error.stack}\n`, {ctx, text, params });
    }

}

module.exports = {
    sendActionLog,
};
