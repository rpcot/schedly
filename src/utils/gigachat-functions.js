const { readFileSync } = require('fs')
const { getDefaultLessons, findNearestLesson, getNearestDayByIndex } = require('./schedule-functions');
const { InlineKeyboard } = require('grammy');
const { gigaChatConfigPath, dayNames } = require('../config');
const gigaChat = require('./structures/gigaChat.const');
const { GigaChatSuggests } = require('../models');

function getGigaChatConfig() {
    return JSON.parse(readFileSync(gigaChatConfigPath, 'utf-8'));
}

function validateResponse(response) {
    const lessons = getDefaultLessons();

    const { types, statuses, codes } = getGigaChatConfig();

    const isExistsLesson = lessons.find((lesson) => lesson.name === response?.lesson_name);

    if (!response) return {
        isError: true,
        message: 'Передано пустое тело ответа',
    }

    if (!Object.keys(statuses).includes(response?.status)) {
        return {
            isError: true,
            message: 'Некорректный статус ответа',
        };
    }

    if (!Object.keys(codes).includes(String(response?.code))) {
        return {
            isError: true,
            message: 'Не передан код завершения',
        };
    }

    if (response?.code > 200) {
        return {
            isError: true,
            message: 'Запрос завершился ошибкой',
        };
    }

    if (!isExistsLesson) {
        return {
            isError: false,
            message: 'Не найден предмет в расписании',
        };
    }

    if (!Object.keys(types).includes(response?.type)) {
        return {
            isError: true,
            message: 'Некорректный тип',
        };
    }

    if (!response?.value) {
        return {
            isError: true,
            message: 'Не передано тело',
        };
    }

    return {
        isError: false,
        message: null,
    };
}

function generateGigaChatSuggestStringView(targetDay, targetLesson, type, value) {
    const { types } = getGigaChatConfig();

    return `<b>Предложение от нейросети:</b>

    <b>${dayNames[targetDay.index]}</b> (${targetDay.date})
    <b>${types[type].name}</b> по предмету <b>${targetLesson.name}</b>:
    ${value}`
        .replace(/  +/g, '');
}

async function getGigaChatResponse(input) {
    const { prompt } = getGigaChatConfig();
    const response = {
        choices: [
            {
                message: {
                    content: '{"status":"success","code":200,"type":"homework","lesson_name":"Алгебра","value":"номер 405"}',
                },
            },
            // {
            //     message: {
            //         content: '{"status":"success","code":200,"type":"exam","lesson_name":"Английский язык","value":"по 1 параграфу"}',
            //     },
            // },
        ],
    };
    // const response = await gigaChat.chat({
    //     messages: [
    //         {
    //             role: 'system',
    //             content: prompt,
    //         },
    //         {
    //             role: 'user',
    //             content: input,
    //         },
    //     ],
    // });

    const answer = response.choices[0]?.message?.content;
    try {
        console.log(answer);

        return JSON.parse(answer);
    } catch (_) {
        console.log(_);

        return null;
    }
}

async function messageProcessing(ctx) {
    const bot = require('../index');

    const input = ctx.msg.text;

    if (!input) return;

    const response = await getGigaChatResponse(input);

    const { isError, message } = validateResponse(response);
    if (isError) {
        return void bot.logger.error(`Ошибка при обработке ответа от Giga:`, { message, input, response });
    }

    const result = findNearestLesson(response.lesson_name);
    if (!result) return;
    const { lessonIndex, dayIndex, currentWeek } = result;
    const day = await getNearestDayByIndex(dayIndex, currentWeek);
    const targetLesson = day.lessons[lessonIndex];

    const suggestData = await createSuggest(day.id, lessonIndex, response.type, response.value);

    const text = generateGigaChatSuggestStringView(day, targetLesson, response.type, response.value);

    const inline = new InlineKeyboard()
        .text('Подтвердить', `gigachat_suggest?:accept?:${suggestData.id}`)
        .text('Отклонить', `gigachat_suggest?:decline?:${suggestData.id}`);

    await ctx.reply(text, {
        parse_mode: 'HTML',
        reply_markup: inline,
        reply_to_message_id: ctx.msg.message_id,
    });

    return suggestData;
}

async function createSuggest(targetDayId, targetLessonIndex, type, value) {
    const bot = require('../index');

    const suggestData = await GigaChatSuggests.create({
        targetDayId,
        targetLessonIndex,
        type,
        value,
    });

    bot.logger.info(`Создано новое предложение от GigaChat:`, { suggestData });

    return suggestData;
}

async function getSuggestById(id) {
    const bot = require('../index');

    const suggestData = await GigaChatSuggests.findByPk(id);

    bot.logger.info('Запрос предложения от GigaChat по ID:', { id, suggestData });

    return suggestData;
}

module.exports = {
    getGigaChatConfig,
    generateGigaChatSuggestStringView,
    messageProcessing,
    createSuggest,
    getSuggestById,
};
