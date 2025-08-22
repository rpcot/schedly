const { InlineKeyboard } = require('grammy');
const { dayNames, defaultLessonsSchedulePath, defaultBellsPath, defaultLessonsPath } = require('../config');
const { Days, Weeks } = require('../models');
const { getSettings } = require('./settings-functions');
const { getTimestampFromDate, getTimestamp } = require('./utils');
const { readFileSync } = require('fs');

function getDefaultLessonsSchedule() {
    return JSON.parse(readFileSync(defaultLessonsSchedulePath, 'utf-8'));
}

function getDefaultBells() {
    return JSON.parse(readFileSync(defaultBellsPath, 'utf-8'));
}

function getDefaultLessons() {
    return JSON.parse(readFileSync(defaultLessonsPath, 'utf-8'));
}

function getWeekDate(difference = 0) {
    const mondayDate = new Date();
    
    if (mondayDate.getDay() === 0) {
        mondayDate.setDate(mondayDate.getDate() - 7);
    }
    
    mondayDate.setHours(0, 0, 0, 0);
    mondayDate.setDate(mondayDate.getDate() - mondayDate.getDay() + 1);

    if (difference !== 0) {
        let differenceModule = Math.abs(difference);
        for (; differenceModule > 0; differenceModule--) {
            if (difference > 0) {
                mondayDate.setDate(mondayDate.getDate() + 7);
            } else {
                mondayDate.setDate(mondayDate.getDate() - 7);
            }
        }
    }

    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);

    const mondayDateString = mondayDate.toLocaleDateString('ru-RU');
    const sundayDateString = sundayDate.toLocaleDateString('ru-RU');

    const weekDateString = `${mondayDateString}-${sundayDateString}`;

    return { weekDateString, mondayDate, sundayDate };
}

function getDayDates(difference = 0) {
    const { mondayDate } = getWeekDate(difference);

    const mondayDateString = mondayDate
        .toLocaleDateString('ru-RU');

    const dayDates = [mondayDateString];
    for (let i = 0; i < 5; i++) {
        mondayDate.setDate(mondayDate.getDate() + 1);

        const dayDateString = mondayDate
            .toLocaleDateString('ru-RU');

        dayDates.push(dayDateString);
    }

    return dayDates;
}

function getNextMonday() {
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    
    if (monday.getDay() === 0) {
        monday.setDate(monday.getDate() + 1);
    } else {
        monday.setDate(monday.getDate() - monday.getDay() + 8);
    }

    return monday;
}

function getDayScheduleText(data, dayOfWeek) {

    let text = `<b>Расписание на ${dayNames[dayOfWeek]} (${data.date})</b>
    `.replace(/  +/g, '');

    let lessonsStartTime;
    let lessonEndTime;
    if (data.holiday) {
        text += '\nВ данный день нет уроков\n';
    } else if (data.lessons.length === 0) {
        text += 'Информация отсутствует';
    } else {
        const defaultBells = getDefaultBells();
        const bells = defaultBells[data.bellsType].intervals;

        const firstNotCanceledLesson = data.lessons
            .filter((lesson) => !lesson.canceled)[0];
        const indexOfFirstNotCanceledLesson = data.lessons.indexOf(firstNotCanceledLesson);
        lessonsStartTime = bells[indexOfFirstNotCanceledLesson]?.split('-')?.[0] || 'неизвестно';

        const lastNotCanceledLesson = data.lessons
            .filter((lesson) => !lesson.canceled)
            .slice(-1)[0];
        const indexOfLastNotCanceledLesson = data.lessons.indexOf(lastNotCanceledLesson);
        lessonEndTime = bells[indexOfLastNotCanceledLesson]?.split('-')?.[1] || 'неизвестно';

        let index = 0;
        for (const lesson of data.lessons) {
            const homework = `\n${lesson.homework.join(', \n') || 'Домашнее задание не указано'}`;
            let lessonText = `\n${index + 1}. <b>${bells[index]} ${lesson.name}</b> (${lesson.cabinet === 'Спортзал' ? 'Спортзал' : `Каб. ${lesson.cabinet}`}): ${homework}`;

            if (lesson.exam) {
                lessonText += `\n⚠️ <b>Проверочная работа</b>: ${lesson.exam}`;
            }

            if (lesson.canceled) {
                lessonText = `<s>${lessonText}</s> [Отменён]`;
            }

            text += lessonText + '\n';

            index++;
        }
    }

    if (data.note) {
        text += `\n<b>Примечание</b>: ${data.note}\n`;
    }

    if (!data.holiday && data.lessons.length !== 0) {
        text += `\n<b>Приходим к ${lessonsStartTime}</b>`;
        text += `\n<b>Заканчиваем в ${lessonEndTime}</b>`;
    }

    return text;

}

async function getDayScheduleById(id) {
    const bot = require('../index');

    const data = await Days.findOne({ where: { id } });

    bot.logger.info('Запрос расписания на день по айди', { id, data });

    return data;
}

async function getDaySchedule(dayOfWeek, weekId) {
    const bot = require('../index');

    const data = await Days.findOne({
        where: { index: dayOfWeek, weekId },
    });

    bot.logger.info(`Запрос расписания на день`, { data, dayOfWeek, weekId });

    return data;
}

async function createNewWeek(weekIndex, { defaultSchedule = false } = {}) {
    const bot = require('../index');

    const defaultLessonsSchedule = getDefaultLessonsSchedule();

    const weekDifference = (defaultSchedule)
        ? weekIndex
        : weekIndex - 1;

    const { weekDateString } = getWeekDate(weekDifference);
    const week = await Weeks.create({ date: weekDateString, number: weekIndex + 1 });

    const dayDates = getDayDates(weekDifference);

    for (let dayIndex = 0; dayIndex < 6; dayIndex++) {
        const bellsType = (dayIndex === 5)
            ? 'shortened'
            : 'default';

        await Days.create({
            index: dayIndex,
            lessons: defaultLessonsSchedule[dayIndex],
            weekId: week.id,
            date: dayDates[dayIndex],
            bellsType,
        });
    }

    bot.logger.info(`Создание новой недели`, { weekIndex });
}

async function getLastWeek() {
    const bot = require('../index');

    const data = await Weeks.findOne({
        order: [['number', 'DESC']],
    });

    bot.logger.info('Запрос последней недели', { data });

    return data;
}

async function getLastThreeWeeks() {
    const bot = require('../index');

    const data = (await Weeks.findAll({
        order: [['number', 'DESC']],
        limit: 3,
    })).reverse();

    bot.logger.info('Запрос трех последних недель', { data });

    return data;
}

async function getCurrentWeek() {
    const bot = require('../index');

    const weeks = await getLastThreeWeeks();

    bot.logger.info('Запрос текущей недели', { data: weeks[0] });

    return weeks[0];
}

async function getNextWeek() {
    const bot = require('../index');

    const weeks = await getLastThreeWeeks();

    bot.logger.info('Запрос следующей недели', { data: weeks[1] });

    return weeks[1];
}

async function getWeekById(id) {
    const bot = require('../index');

    const data = await Weeks.findByPk(id, {
        include: [
            {
                model: Days,
                as: 'days',
            },
        ],
    });

    bot.logger.info('Запрос недели', { id, data });

    return data;
}

async function getAllWeeks() {
    const bot = require('../index');

    const data = await Weeks.findAll();

    bot.logger.info('Запрос всех недель', { data });

    return data;
}

async function showScheduleManage(ctx, { update } = {}) {

    const lastThreeWeeks = await getLastThreeWeeks();
    const ids = lastThreeWeeks.map((week) => week.id);

    const inline = new InlineKeyboard()
        .text('Текущая неделя', `manage?:${ctx.from.id}?:${ids[0]}`)
        .row()
        .text('Следующая неделя', `manage?:${ctx.from.id}?:${ids[1]}`)
        .row()
        .text('Через две', `manage?:${ctx.from.id}?:${ids[2]}`);

    if (update) {
        await ctx.editMessageText('Выбери неделю:', {
            reply_markup: inline,
        });
    } else {
        await ctx.reply('Выбери неделю:', {
            reply_markup: inline,
        });
    }

}

async function showScheduleDayChoose(ctx, weekId) {

    const week = await getWeekById(weekId);

    const inline = new InlineKeyboard()
        .text('Понедельник', `manage?:${ctx.from.id}?:${weekId}?:0`)
        .text('Вторник', `manage?:${ctx.from.id}?:${weekId}?:1`)
        .row()
        .text('Среда', `manage?:${ctx.from.id}?:${weekId}?:2`)
        .text('Четверг', `manage?:${ctx.from.id}?:${weekId}?:3`)
        .row()
        .text('Пятница', `manage?:${ctx.from.id}?:${weekId}?:4`)
        .text('Суббота', `manage?:${ctx.from.id}?:${weekId}?:5`)
        .row()
        .text('Вернуться', `back_week_choose?:${ctx.from.id}`);

    try {
        await ctx.editMessageText(`Выбери день недели ${week.date}:`, {
            reply_markup: inline,
        });
    } catch (_) {
        await showScheduleManage(ctx, { update: true });
    }

}

async function showManageDay(ctx, weekId, dayOfWeek, { editMessageId } = {}) {

    dayOfWeek = parseInt(dayOfWeek);

    const data = await getDaySchedule(dayOfWeek, weekId);

    const inline = new InlineKeyboard()
        .text('Добавить ДЗ', `choose_lesson?:${ctx.from.id}?:${data.id}?:add_homework`)
        .text('Удалить ДЗ', `choose_lesson?:${ctx.from.id}?:${data.id}?:del_homework`)
        .row()
        .text('Перенести ДЗ', `choose_lesson?:${ctx.from.id}?:${data.id}?:move_homework`)
        .row()
        .text('Добавить или удалить проверочную', `choose_lesson?:${ctx.from.id}?:${data.id}?:manage_exam`)
        .row()
        .text('Изменить звонки', `change_bells?:${ctx.from.id}?:${data.id}`)
        .row()
        .text('Изменить кабинет', `choose_lesson?:${ctx.from.id}?:${data.id}?:change_cabinet`)
        .row()
        .text('Добавить урок', `add_lesson?:${ctx.from.id}?:${data.id}`)
        .text('Удалить урок', `choose_lesson?:${ctx.from.id}?:${data.id}?:del_lesson`)
        .row()
        .text('Поменять местами уроки', `move_lesson?:${ctx.from.id}?:${data.id}`)
        .row()
        .text('Отменить урок', `toggle_lesson?:${ctx.from.id}?:${data.id}`)
        .text((data.holiday) ? `Отметить учебным` : `Отметить неучебным`, `toggle_holiday?:${ctx.from.id}?:${data.id}`)
        .row()
        .text('Добавить или удалить примечание', `manage_note?:${ctx.from.id}?:${data.id}`)
        .row()
        .text('Вернуться', `manage?:${ctx.from.id}?:${weekId}`);

    const text = getDayScheduleText(data, dayOfWeek);

    if (editMessageId) {
        try {
            await ctx.api.editMessageText(ctx.chat.id, editMessageId, text, {
                parse_mode: 'HTML',
                reply_markup: inline,
            });
        } catch (_) {
            await ctx.reply(text, {
                parse_mode: 'HTML',
                reply_markup: inline,
            });
        }
    } else {
        await ctx.editMessageText(text, {
            parse_mode: 'HTML',
            reply_markup: inline,
        });
    }

}

async function showScheduleDay(ctx, time) {

    const currentDate = new Date();

    let currentWeek = true;
    let dayOfWeek;
    if (currentDate.getDay() === 0 && time === 'today') {
        currentWeek = false;
        dayOfWeek = 0;
    } else if ((currentDate.getDay() === 0 || currentDate.getDay() === 6) && time === 'tomorrow') {
        currentWeek = false;
        dayOfWeek = 0;
    } else {
        dayOfWeek = currentDate.getDay() - ((time === 'today') ? 1 : 0);
    }

    let week;
    if (currentWeek) {
        week = await getCurrentWeek();
    } else {
        week = await getNextWeek();
    }

    const weekDays = await week.getDays();

    const data = weekDays[dayOfWeek];

    const text = getDayScheduleText(data, dayOfWeek);

    try {
        await ctx.editMessageText(text, {
            parse_mode: 'HTML',
        });
    } catch (_) {
        await ctx.reply(text, {
            parse_mode: 'HTML',
        });
    }

}

async function createDefaultSchedule() {
    const bot = require('../index');

    bot.logger.info(`Создание стандартного расписания`);

    for (let weekIndex = 0; weekIndex < 3; weekIndex++) {
        await createNewWeek(weekIndex, { defaultSchedule: true });
    }

    bot.logger.info('Стандартное расписание создано');
}

async function rotateSchedule() {

    const bot = require('../index');

    bot.logger.info('Обновление расписания');

    const lastWeek = await getLastWeek();

    await createNewWeek(lastWeek.number, { defaultSchedule: false });

    bot.logger.info('Обновление расписания завершено');

}

async function monitoringSchedules() {
    const bot = require('../index');

    bot.logger.info('Мониторинг расписания запущен');

    setInterval(async () => {
        const settings = await getSettings();

        if (settings.nextScheduleRotate === 0) {
            settings.nextScheduleRotate = getTimestampFromDate(getNextMonday());
            await settings.save();

            await createDefaultSchedule();
        } else if (settings.nextScheduleRotate < getTimestamp()) {
            settings.nextScheduleRotate = getTimestampFromDate(getNextMonday());
            await settings.save();

            await rotateSchedule();
        }
    }, 10 * 1000);
}

async function showLessonChoose(ctx, data, inlineId, { text = 'Выбери урок:', args = '', exceptions = [], dataId = '' } = {}) {

    const inline = new InlineKeyboard();

    let index = 0;
    let count = 1;
    for (const lesson of data.lessons) {
        if (!exceptions.includes(index)) {
            inline.text(
                `${index + 1}. ${lesson.name}`, `${inlineId}?:${ctx.from.id}?:${dataId || data.id}?:${args}?:${index}`
                    .replace('?:?:', '?:')
            );

            count++;

            if (count % 2 === 1) {
                inline.row();
            }
        }

        index++;
    }

    if (count % 2 !== 1) {
        inline.row();
    }

    inline.text('Вернуться', `back_manage_day?:${ctx.from.id}?:${dataId || data.id}`);

    await ctx.editMessageText(text, {
        reply_markup: inline,
    });

}

async function showToggleLessonChoose(ctx, data) {

    const inline = new InlineKeyboard();

    let count = 1;
    for (const lesson of data.lessons) {
        inline.text(`${count}. ${lesson.canceled ? '❌' : '✅'} ${lesson.name}`, `toggle_lesson?:${ctx.from.id}?:${data.id}?:${count - 1}`);

        count++;

        if (count % 2 === 1) {
            inline.row();
        }
    }

    if (count % 2 !== 1) {
        inline.row();
    }

    inline.text('Вернуться', `back_manage_day?:${ctx.from.id}?:${data.id}`);

    await ctx.editMessageText('Выбери урок:', {
        reply_markup: inline,
    });

}

async function sendBotSiteURL(ctx) {

    const siteURL = `https://schedule.rpcot.ru/schedule`;

    const inline = new InlineKeyboard()
        .url('Перейти на сайт', siteURL);

    await ctx.reply(`Сайт бота - <b>${siteURL}</b>`, {
        parse_mode: 'HTML',
        reply_markup: inline,
        disable_web_page_preview: true,
    });

}

module.exports = {
    getDefaultLessonsSchedule,
    getDefaultBells,
    getDefaultLessons,
    getDayScheduleById,
    getDaySchedule,
    getLastWeek,
    getLastThreeWeeks,
    getCurrentWeek,
    getNextWeek,
    getWeekById,
    getAllWeeks,
    showScheduleManage,
    showScheduleDay,
    showScheduleDayChoose,
    showManageDay,
    monitoringSchedules,
    showLessonChoose,
    showToggleLessonChoose,
    sendBotSiteURL,
};
