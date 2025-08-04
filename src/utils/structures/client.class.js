const { Bot } = require('grammy');
const Database = require('./database.class');
const createRPLogger = require('./logger.function');
const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { getTimestamp } = require('../utils');
const { monitoringSchedules } = require('../schedule-functions');

class RPClient extends Bot {

    constructor(token) {
        super(token);
        this.bot = new Bot(token);
        this.config = require('../../config');
        this.logger = createRPLogger(this.config.logsPath, this.config.consoleLogging, this.config.logging);
        this.db = new Database(this.config.databaseSettings);
        this.commands = [];
        this.inlines = new Map();
    }

    handleCommands() {

        this.logger.info('Начало загрузки команд');

        const commandsFolder = readdirSync(this.config.commandsPath);
        for (const commandFile of commandsFolder) {

            const commandPath = join(this.config.commandsPath, commandFile);
            const command = require(commandPath);

            if ('name' in command && 'description' in command && 'execute' in command) {
                this.bot.command(command.name, async (ctx) => {
                    try {
                        delete ctx.api.token;
                        this.logger.info(`Получена команда ${ctx.msg.text}`, { ctx });
                        const commandWriteTimestampDiff = getTimestamp() - ctx.update.message.date;
                        if (commandWriteTimestampDiff > 30) {
                            this.logger.info(`Команда ${ctx.msg.text} проигнорирована Разница: ${commandWriteTimestampDiff} сек.`);
                            return;
                        }
                        const startTimestamp = new Date().getTime();
                        const args = ctx.msg.text.split(' ')[1];
                        await command.execute(this, ctx, args);
                        const diff = new Date().getTime() - startTimestamp;
                        this.logger.info(`Команда ${ctx.msg.text} выполнена Задержка: ${diff} мс.`);
                    } catch(error) {
                        this.logger.error(`Возникла ошибка при обработке команды ${ctx.msg.text}:\n${error.stack}\n`, { ctx });
                    }
                });
                if (!command.hide) {
                    this.commands.push({ command: command.name, description: command.description });
                }
                this.logger.info(`Команда ${command.name} успешно загружена`);
            } else {
                this.logger.log('warning', `Команда ${commandFile} должна иметь execute, name и description`);
            }

        }
        this.bot.api.setMyCommands(this.commands);
        console.log(`[ИНФОРМАЦИЯ] Загружено ${this.commands.length} команд`);
        this.logger.info(`Загружено ${this.commands.length} команд`);
        
    }

    handleInlineKeyboards() {

        this.logger.info('Начало загрузки инлайн клавиатуры');

        const inlineFolder = readdirSync(this.config.inlinePath);
        for (const inlineFile of inlineFolder) {

            const inlinePath = join(this.config.inlinePath, inlineFile);
            const inline = require(inlinePath);

            if ('data' in inline && 'execute' in inline) {
                this.inlines.set(inline.data, inline);
                this.logger.info(`Инлайн клавиатура ${inline.data} загружена`);
            } else {
                this.logger.log('warning', `Инлайн клавиатура ${inlineFile} должна иметь execute и data`);
            }

        }
        console.log(`[ИНФОРМАЦИЯ] Инлайн клавиатура загружена`);
        this.logger.info('Инлайн клавиатура загружена');

        this.bot.on('callback_query:data', async (ctx) => {
        
            const [data, ...args] = ctx.callbackQuery.data.split('?:');

            const inline = this.inlines.get(data);

            if (inline) {
                let startTimestamp = new Date().getTime();
                try {
                    delete ctx.api.token;
                    this.logger.info(`Получена инлайн клавиатура ${ctx.callbackQuery.data}`, { ctx });
                    await inline.execute(this, ctx, ...args);
                    const diff = new Date().getTime() - startTimestamp;
                    this.logger.info(`Инлайн клавиатура ${ctx.callbackQuery.data} обработана Задержка: ${diff} мс.`);
                } catch(error) {
                    if (error.message?.includes('Bad Request: query is too old and response timeout expired or query ID is invalid')) {
                        const diff = new Date().getTime() - startTimestamp;
                        this.logger.log('warning', `Инлайн клавиатура ${ctx.callbackQuery.data} не обработана Задержка: ${diff} мс.`);
                    }
                    this.logger.error(`Возникла ошибка при обработке инлайн клавиатуры ${ctx.callbackQuery.data}:\n${error.stack}\n`, { ctx });
                }
            }

        });

    }

    handleKeyboard() {

        this.logger.info('Начало загрузки клавиатуры');

        const keyboardFolder = readdirSync(this.config.keyboardPath);
        for (const keyboardFile of keyboardFolder) {

            const keyboardPath = join(this.config.keyboardPath, keyboardFile);
            const keyboard = require(keyboardPath);

            if ('data' in keyboard && 'execute' in keyboard) {
                this.bot.hears(keyboard.data, async (ctx) => {
                    try {
                        delete ctx.api.token;
                        this.logger.info(`Получена клавиатура ${keyboard.data}`, { ctx });
                        const startTimestamp = new Date().getTime();
                        await keyboard.execute(this, ctx);
                        const diff = new Date().getTime() - startTimestamp;
                        this.logger.info(`Клавиатура ${keyboard.data} обработана Задержка: ${diff} мс.`);
                    } catch(error) {
                        this.logger.error(`Возникла ошибка при обработке клавиатуры ${keyboard.data}:\n${error.stack}\n`, { ctx });
                    }
                });
                this.logger.info(`Клавиатура ${keyboard.data} загружена`);
            } else {
                this.logger.log('warning', `Клавиатура ${keyboardFile} должна иметь execute и data`);
            }

        }
        console.log(`[ИНФОРМАЦИЯ] Клавиатура загружена`);
        this.logger.info('Клавиатура загружена');

    }

    handleEvents() {

        this.logger.info('Начало загрузки ивентов');

        const eventsFolder = readdirSync(this.config.eventsPath);
        for (const eventFile of eventsFolder) {

            const eventPath = join(this.config.eventsPath, eventFile);
            const event = require(eventPath);

            if ('name' in event && 'execute' in event) {
                this.bot.on(event.name, async (ctx) => {
                    try {
                        delete ctx.api.token;
                        this.logger.info(`Получен ивент ${event.name}`, { ctx });
                        const startTimestamp = new Date().getTime();
                        await event.execute(this, ctx);
                        const diff = new Date().getTime() - startTimestamp;
                        this.logger.info(`Ивент ${event.name} обработан Задержка: ${diff} мс.`);
                    } catch(error) {
                        this.logger.error(`Возникла ошибка при обработке ивента ${event.name}:\n${error.stack}\n`, { ctx });
                    }
                });
                this.logger.info(`Ивент ${event.name} загружен`);
            } else {
                this.logger.log('warning', `Ивент ${event.name} должен иметь`)
            }

        }
        console.log(`[ИНФОРМАЦИЯ] Ивенты загружены`);
        this.logger.info('Ивенты загружены');

    }

    async login() {

        this.logger.info('Старт бота');

        this.bot.start();

        const me = await this.bot.api.getMe();

        console.log('--------------' + '-'.repeat(me.username.length + 4));
        console.log(`    Бот готов ${me.username}`);
        console.log('--------------' + '-'.repeat(me.username.length + 4));

        this.logger.info(`Бот запущен (${me.username})`);

        this.logger.info('Запуск мониторингов');

        await monitoringSchedules();

    }

}

module.exports = RPClient;