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
} = process.env;

module.exports = {
    token: TOKEN,

    apiHost: API_HOST,
    apiPort: API_PORT,
    WeekUrlTemplate: '', // URL template for generating schedule links by week number, e.g. https://schedule.rpcot.ru/schedule?week=

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

    logsPath: join(resolve(__dirname, '..'), 'logs'),
    consoleLogging: true, // logging to console
    logging: true, // logging to log file

    developerId: -1, // telegram id of developer

    loggingChannelId: -1, // telegram id of logging channel

    dayNames: [
        'Понедельник',
        'Вторник',
        'Среда',
        'Четверг',
        'Пятница',
        'Суббота',
    ],
}