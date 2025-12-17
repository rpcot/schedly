const { join, resolve } = require('node:path');
require('dotenv').config();

const {
    TOKEN,
    API_HOST,
    API_PORT,
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    GIGA_CHAT_KEY,
} = process.env;

module.exports = {
    token: TOKEN,

    apiHost: API_HOST,
    apiPort: API_PORT,
    weekUrlTemplate: '', // URL template for generating schedule links by week number, e.g. https://schedly.rpcot.ru?week=
    attachmentUrlTemplate: '', // URL template for generating attachment links by attachment id, e.g. https://api.schedule.rpcot.ru/attachment/

    giga: {
        key: GIGA_CHAT_KEY,
        scope: 'GIGACHAT_API_PERS',
        model: 'GigaChat-2',
    },

    databaseSettings: {
        dialect: 'mysql',
        port: DB_PORT,
        host: DB_HOST,
        db: DB_NAME,
        user: DB_USER,
        password: DB_PASSWORD,
        modelsPath: join(__dirname, 'models'),
    },

    eventsPath: join(__dirname, 'events'),
    commandsPath: join(__dirname, 'commands'),
    inlinePath: join(__dirname, 'inline'),
    keyboardPath: join(__dirname, 'keyboard'),
    defaultLessonsSchedulePath: join(__dirname, 'data', 'default_lessons_schedule.json'),
    defaultBellsPath: join(__dirname, 'data', 'default_bells.json'),
    defaultPrefixesPath: join(__dirname, 'data', 'default_prefixes.json'),
    defaultLessonsPath: join(__dirname, 'data', 'default_lessons.json'),
    changelogConfigPath: join(__dirname, 'data', 'changelog_config.json'),
    gigaChatConfigPath: join(__dirname, 'data', 'giga_chat_config.json'),
    certsPath: join(__dirname, 'certs'),
    holidaysConfigPath: join(__dirname, 'data', 'holidays.json'),

    logsPath: join(resolve(__dirname, '..'), 'logs'),
    consoleLogging: true, // logging to console
    logging: true, // logging to log file

    developerId: -1, // telegram id of developer

    loggingChannelId: -1, // telegram id of logging channel
    generalChannelId: -1, // telegram id of general channel

    dayNames: [
        'Понедельник',
        'Вторник',
        'Среда',
        'Четверг',
        'Пятница',
        'Суббота',
    ],
}