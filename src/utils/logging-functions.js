const { loggingChannelId, generalChannelId, dayNames } = require('../config');
const { getGigaChatConfig } = require('./gigachat-functions');

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
        bot.logger.error(`Возникла ошибка при логировании действия:\n${error.stack}\n`, { ctx, text, params });
    }
}

async function sendChangeCabinetTodayLog(ctx, lessonData, oldCabinet, lessonNumber) {
    const bot = require('../index');

    try {
        const text = `‼️ Урок <b>${lessonData.name}</b> (${lessonNumber}) перенесен в кабинет <b>${lessonData.cabinet}</b> (ранее: ${oldCabinet})`

        await ctx.api.sendMessage(generalChannelId, text, {
            parse_mode: 'HTML',
        });
    } catch (error) {
        bot.logger.error(`Возникла ошибка при отправке оповещения об изменении кабинета:\n${error.stack}`, { ctx, lesson, oldCabinet })
    }
}

async function sendDisableLessonTodayLog(ctx, lessonData, lessonNumber) {
    const bot = require('../index');

    try {
        const text = `‼️ Урок <b>${lessonData.name}</b> (${lessonNumber}) отменен`;

        await ctx.api.sendMessage(generalChannelId, text, {
            parse_mode: 'HTML',
        });
    } catch (error) {
        bot.logger.error(`Возникла ошибка при отправке оповещения об отмене урока:\n${error.stack}`, { ctx, lesson, oldCabinet })
    }
}

async function sendAddExamLog(ctx, lessonData, targetDay, lessonNumber) {
    const bot = require('../index');

    try {
        const text = `🔖 Добавлена <b>проверочная работа</b> по предмету <b>${lessonData.name}</b> (${lessonNumber}) на <b>${dayNames[targetDay.index]}</b> (${targetDay.date}):
        ${lessonData.exam}`
            .replace(/  +/g, '');

        await ctx.api.sendMessage(generalChannelId, text, {
            parse_mode: 'HTML',
        });
    } catch (error) {
        bot.logger.error(`Возникла ошибка при отправке оповещения о добавлении проверочной:\n${error.stack}`, { ctx, lesson, oldCabinet })
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

async function sendGigaChatActionLog(ctx, text, suggestId, params = []) {
    const bot = require('../index');

    try {
        const messageText = `<b>[Предложение <code>${suggestId}</code>] ${new Date().toLocaleString('ru-RU')}</b>
        ${text}
        ${params.join('\n')}
        `.replace(/  +/g, '');

        await ctx.api.sendMessage(loggingChannelId, messageText, {
            parse_mode: 'HTML',
        });
    } catch (error) {
        bot.logger.error(`Возникла ошибка при логировании действия GigaChat:\n${error.stack}\n`, { ctx, text, params });
    }
}

async function sendGigaChatSuggestDecline(ctx, targetDay, suggestData) {
    const bot = require('../index');

    const { types } = getGigaChatConfig();

    try {
        const text = `<b>Предложение от GigaChat [<code>${suggestData.id}</code>] отклонено</b>:
        <b>Предложение</b>
        • Тип: <b>${types[suggestData.type].name}</b>
        • Значение: <b>${suggestData.value}</b>
        <b>День</b>
        • Название: <b>${dayNames[targetDay.index]}</b>
        • Дата: <b>${targetDay.date}</b>
        • Айди: <b>${targetDay.id}</b>
        `.replace(/  +/g, '');

        await ctx.api.sendMessage(loggingChannelId, text, {
            parse_mode: 'HTML',
        });
    } catch (error) {
        bot.logger.error(`Возникла ошибка при отправке лога отклонения предложения GigaChat:\n${error.stack}`, { suggestData });
    }
}

async function sendGigaChatSuggestSended(ctx, targetDay, suggestData) {
    const bot = require('../index');

    const { types } = getGigaChatConfig();

    try {
        const text = `<b>Новое предложение от GigaChat [<code>${suggestData.id}</code>]</b>:
        <b>Предложение</b>
        • Тип: <b>${types[suggestData.type].name}</b>
        • Значение: <b>${suggestData.value}</b>
        <b>День</b>
        • Название: <b>${dayNames[targetDay.index]}</b>
        • Дата: <b>${targetDay.date}</b>
        • Айди: <b>${targetDay.id}</b>
        `.replace(/  +/g, '');

        await ctx.api.sendMessage(loggingChannelId, text, {
            parse_mode: 'HTML',
        });
    } catch (error) {
        bot.logger.error(`Возникла ошибка при отправке лога отклонения предложения GigaChat:\n${error.stack}`, { suggestData });
    }
}

module.exports = {
    sendActionLog,
    sendChangeCabinetTodayLog,
    sendDisableLessonTodayLog,
    sendAddExamLog,
    sendChangeDayNoteLog,
    sendGigaChatActionLog,
    sendGigaChatSuggestDecline,
    sendGigaChatSuggestSended,
};
