const { token } = require('./config');
const RPClient = require('./utils/structures/client.class');

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