const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const database = require('./database.const');

class Database {

    constructor(settings) {
        this.database = database;
        this.models = new Map();
        this.modelsPath = settings.modelsPath;
    }

    async connect(logger) {
        try {
            logger.info('Попытка подключения к базе данных', { modelsPath: this.modelsPath });
            await this.database.authenticate();
            console.log(`[ИНФОРМАЦИЯ] Соединение с БД успешно установлено`);
            logger.info(`Соединение с БД успешно установлено`);
        } catch (error) {
            logger.error(`Не удалось установить соединение с БД:\n${error.stack}`);
        }
    }

    async syncModels(logger, options = {}) {
        const models = require(this.modelsPath);

        logger.info('Начало синхронизации таблиц...');
        for (const [modelName, model] of Object.entries(models)) {
            await model.sync(options);

            this.models.set(modelName, model);

            logger.info(`Таблица ${modelName} синхронизирована`);
            console.log(`[ИНФОРМАЦИЯ] Таблица ${modelName} синхронизирована`);
        }
        logger.info('Синхронизация таблиц завершена');
    }

}

module.exports = Database;