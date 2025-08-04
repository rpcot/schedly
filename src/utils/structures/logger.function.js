const { readFileSync, writeFileSync, createWriteStream } = require('node:fs');
const { createLogger, transports, format, config } = require('winston');
const archiver = require('archiver');

function createRPLogger(logsPath, consoleLogging, logging) {

    const logger = createLogger({
        level: 'info',
        levels: config.syslog.levels,
        format: format.combine(
            format.errors({ stack: true }),
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.printf(info => {
                const infoToLogFile = { ...info };
                delete infoToLogFile.timestamp;
                delete infoToLogFile.level;
                delete infoToLogFile.message;
                return `${info.timestamp} ${info.level}: ${info.message} ${JSON.stringify(infoToLogFile)}`;
            }),
        ),
        transports: [
            new transports.File({ dirname: logsPath, filename: 'error.log', level: 'error', silent: !logging }),
            new transports.File({ dirname: logsPath, filename: 'combined.log', silent: !logging }),
            new transports.Console({
                level: (consoleLogging) ? 'debug' : 'warning',
                format: format.combine(
                    format.colorize({ all: true }),
                    format.simple(),
                ),
            }),
        ],
    });

    logger.logging = logging;
    logger.consoleLogging = consoleLogging;
    logger.logsPath = logsPath;

    logger.new = async function () {
        try {

            if (!logging) return;

            const log = (readFileSync(`${logsPath}/combined.log`, 'utf-8', )).split('\n');

            const fullTimeString = log[0].slice(0, 19);
            const name = fullTimeString.replace(':', '.').replace(':', '.');

            if (!name) return;

            const output = createWriteStream(`${logsPath}/${name}.zip`);
            const archive = await archiver('zip', {
                zlib: { level: 9 },
            });
            
            await archive.file(`${logsPath}/combined.log`, { name: 'combined.log' });
            await archive.file(`${logsPath}/error.log`, { name: 'error.log' });

            await archive.pipe(output);
            await archive.finalize();

            writeFileSync(`${logsPath}/combined.log`, '');
            writeFileSync(`${logsPath}/error.log`, '');

        } catch(_) {
            console.log(_);
        }
    }

    return logger;

}

module.exports = createRPLogger;