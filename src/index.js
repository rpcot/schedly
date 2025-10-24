const { token, certsPath } = require('./config');
const RPClient = require('./utils/structures/client.class');
const { resolve } = require('path');

process.env.NODE_EXTRA_CA_CERTS = resolve(__dirname, certsPath)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const bot = new RPClient(token);

(async function () {
    await bot.logger.new();

    bot.handleCommands();
    bot.handleInlineKeyboards();
    bot.handleKeyboard();
    bot.handleEvents();

    await bot.db.connect(bot.logger);
    await bot.db.syncModels(bot.logger, { alter: true });

    bot.login();
})();

module.exports = bot;

process.on('unhandledRejection', (reason, promise) => {
    bot.logger.log('crit', `Возникла критическая ошибка в главном процессе:\n${reason}`, { type: 'unhandledRejection' });
    console.error(promise);
});
process.on('uncaughtException', (error, origin) => {
    bot.logger.log('crit', `Возникла критическая ошибка в главном процессе:\n${error.stack}`, { type: 'uncaughtException', origin });
});