const { InlineKeyboard } = require('grammy');
const { dayNames, defaultLessonsSchedulePath, defaultBellsPath, defaultLessonsPath, subgroupsPath, botStartUrl } = require('../config');
const { Days, Weeks } = require('../models');
const { getSettings } = require('./settings-functions');
const { getTimestampFromDate, getTimestamp, plural, errorAnswer } = require('./utils');
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

function getSubgroups() {
    return JSON.parse(readFileSync(subgroupsPath, 'utf-8'));
}

function getWeekDate(offset = 0) {
    const mondayDate = new Date();

    if (mondayDate.getDay() === 0) {
        mondayDate.setDate(mondayDate.getDate() - 7);
    }

    mondayDate.setHours(0, 0, 0, 0);
    mondayDate.setDate(mondayDate.getDate() - mondayDate.getDay() + 1);

    if (offset !== 0) {
        let offsetModule = Math.abs(offset);
        for (; offsetModule > 0; offsetModule--) {
            if (offset > 0) {
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

function getDayDates(offset = 0) {
    const { mondayDate } = getWeekDate(offset);

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
            const cabinetsWithoutCaption = ['Спортзал', '-', 'Не указан'];
            const cabinet = (cabinetsWithoutCaption.includes(lesson.cabinet))
                ? lesson.cabinet
                : `Каб. ${lesson.cabinet}`;

            const homework = `\n${lesson.homework.join(', \n') || 'Домашнее задание не указано'}`;
            let lessonText = `\n${index + 1}. <b>${bells[index]} ${lesson.name}</b> (${cabinet}): ${homework}`;

            if (lesson.attachments?.length) {
                lessonText += `\n└─ ${lesson.attachments.map((attachment) => `<a href="${botStartUrl}attachment_${attachment.id}">${attachment.name}</a>`).join(' • ')}`;
            }

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

    return { originalText: text, slicedText: text.slice(0, 4096) };

}

function findNearestLesson(lessonName) {
    const days = getDefaultLessonsSchedule();

    const occurrences = days
        .map((lessons, dayIndex) => {
            const lessonIdx = lessons.findIndex(lesson => lesson.name === lessonName);
            return lessonIdx !== -1 ? { dayIndex, lessonIndex: lessonIdx } : null;
        })
        .filter(Boolean);

    if (occurrences.length === 0)
        return null;

    const todayIndex = new Date().getDay() - 1;

    const targetOccurrence = occurrences.find(({ dayIndex }) => dayIndex > todayIndex);

    const nextOccurrence = targetOccurrence
        ? {
            currentWeek: true,
            dayIndex: targetOccurrence.dayIndex,
            lessonIndex: targetOccurrence.lessonIndex,
        }
        : {
            currentWeek: false,
            dayIndex: occurrences[0].dayIndex,
            lessonIndex: occurrences[0].lessonIndex,
        };

    return nextOccurrence;
}

function generateSelectTeacherIdInline(lessonName, confirmInlineId, cancelInlineId) {
    const subgroups = getSubgroups();

    const inline = new InlineKeyboard();

    const teachers = subgroups.lessons[lessonName];
    for (const teacherId of teachers) {
        const groupName = (teacherId === 'all')
            ? 'Для всех'
            : `Группа ${subgroups.teachers[teacherId]}`;
        inline.text(groupName, confirmInlineId.replace('[teacherId]', teacherId));
    }

    inline
        .row()
        .text('Отменить', cancelInlineId);

    return inline;
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

async function getNearestDayByIndex(dayIndex, currentWeek) {
    const bot = require('../index');

    let targetWeek = null;
    if (currentWeek) {
        targetWeek = await getCurrentWeek();
    } else {
        targetWeek = await getNextWeek();
    }
    const weekId = targetWeek.id;

    const data = await Days.findOne({
        where: { index: dayIndex, weekId },
    });

    bot.logger.info(`Запрос дня по индексу`, { data, dayIndex, weekId });

    return data;
}

async function createNewWeek(weekIndex, { weekOffset = 0 } = {}) {
    const bot = require('../index');

    const defaultLessonsSchedule = getDefaultLessonsSchedule();

    const { weekDateString } = getWeekDate(weekOffset);
    const week = await Weeks.create({ date: weekDateString, number: weekIndex + 1 });

    const dayDates = getDayDates(weekOffset);

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
        .text('Добавить вложение', `choose_lesson?:${ctx.from.id}?:${data.id}?:add_attachment`)
        .text('Удалить вложение', `choose_lesson?:${ctx.from.id}?:${data.id}?:del_attachment`)
        .row()
        .text('Добавить или удалить проверочную', `choose_lesson?:${ctx.from.id}?:${data.id}?:manage_exam`)
        .row()
        .text('Изменить звонки', `change_bells?:${ctx.from.id}?:${data.id}`)
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
        .text('Добавить или удалить примечание', `manage_note?:${ctx.from.id}?:${data.id}`);

    const hasAttachments = await data.countAttachments();
    if (hasAttachments) {
        inline
            .row()
            .text('Посмотреть вложения', `show_attachment?:${ctx.from.id}?:${data.id}?:true`);
    }

    inline
        .row()
        .text('Вернуться', `manage?:${ctx.from.id}?:${weekId}`);

    const { originalText, slicedText } = getDayScheduleText(data, dayOfWeek);
    const parse_mode = originalText.length > 4096
        ? null
        : 'HTML';

    if (editMessageId) {
        try {
            await ctx.api.editMessageText(ctx.chat.id, editMessageId, slicedText, {
                parse_mode,
                reply_markup: inline,
            });
        } catch (_) {
            await ctx.reply(slicedText, {
                parse_mode,
                reply_markup: inline,
            });
        }
    } else {
        await ctx.editMessageText(slicedText, {
            parse_mode,
            reply_markup: inline,
        });
    }

}

async function showScheduleDayByWeekId(ctx, weekId, dayOfWeek, { editMessageId } = {}) {

    dayOfWeek = parseInt(dayOfWeek);

    const data = await getDaySchedule(dayOfWeek, weekId);

    const { originalText, slicedText } = getDayScheduleText(data, dayOfWeek);
    const hasAttachments = await data.countAttachments();
    const parse_mode = originalText.length > 4096
        ? null
        : 'HTML';
    const reply_markup = (ctx.chat.type !== 'private')
        ? { remove_keyboard: true }
        : (hasAttachments)
            ? new InlineKeyboard().text('Посмотреть вложения', `show_attachment?:${ctx.from.id}?:${data.id}?:false`)
            : null;

    if (editMessageId) {
        try {
            await ctx.api.editMessageText(ctx.chat.id, editMessageId, slicedText, {
                parse_mode,
                reply_markup,
            });
        } catch (_) {
            await ctx.reply(slicedText, {
                parse_mode,
                reply_markup,
            });
        }
    } else {
        try {
            await ctx.editMessageText(slicedText, {
                parse_mode,
                reply_markup,
            });
        } catch (_) {
            await ctx.reply(slicedText, {
                parse_mode,
                reply_markup,
            });
        }
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

    await showScheduleDayByWeekId(ctx, data.weekId, data.index);

}

async function createDefaultSchedule() {
    const bot = require('../index');

    bot.logger.info(`Создание стандартного расписания`);

    for (let weekIndex = 0; weekIndex < 3; weekIndex++) {
        await createNewWeek(weekIndex, { weekOffset: weekIndex });
    }

    bot.logger.info('Стандартное расписание создано');
}

async function rotateSchedule() {

    const bot = require('../index');

    bot.logger.info('Обновление расписания');

    const lastWeek = await getLastWeek();

    await createNewWeek(lastWeek.number, { weekOffset: 2 });

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

async function showLessonChoose(ctx, data, inlineId, { text = 'Выбери урок:', args = '', exceptions = [], dataId = '', backInlineId = 'back_manage_day' } = {}) {

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

    inline.text('Вернуться', `${backInlineId}?:${ctx.from.id}?:${dataId || data.id}`);

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

    const siteURL = `https://schedly.rpcot.ru`;

    const inline = new InlineKeyboard()
        .url('Перейти на сайт', siteURL);

    await ctx.reply(`Сайт бота - <b>${siteURL}</b>`, {
        parse_mode: 'HTML',
        reply_markup: inline,
        disable_web_page_preview: true,
    });

}

async function addHomeworkToLesson(data, targetLessonIndex, homework, { teacherId } = {}) {
    let homeworkText = homework.slice(0, 300);
    if (teacherId) {
        const { teachers } = getSubgroups();
        homeworkText = (teacherId === 'all')
            ? `для всех: ${homeworkText}`
            : `группа ${teachers[teacherId]}: ${homeworkText}`;
    }

    const targetLessonData = data.lessons[targetLessonIndex];

    for (const lesson of data.lessons) {
        if (lesson.name === targetLessonData.name && lesson.homework.length < 3) {
            lesson.homework.push(homeworkText);
        }
    }
    await Days.update({ lessons: data.lessons }, { where: { id: data.id } });

    return data.lessons;
}

async function addExamToLesson(data, targetLessonIndex, exam) {
    data.lessons[targetLessonIndex].exam = exam.slice(0, 100);
    await Days.update({ lessons: data.lessons }, { where: { id: data.id } });

    return data.lessons[targetLessonIndex];
}

module.exports = {
    getDefaultLessonsSchedule,
    getDefaultBells,
    getDefaultLessons,
    getSubgroups,
    findNearestLesson,
    generateSelectTeacherIdInline,
    getDayScheduleById,
    getDaySchedule,
    getNearestDayByIndex,
    getLastWeek,
    getLastThreeWeeks,
    getCurrentWeek,
    getNextWeek,
    getWeekById,
    getAllWeeks,
    showScheduleManage,
    showScheduleDay,
    showScheduleDayByWeekId,
    showScheduleDayChoose,
    showManageDay,
    monitoringSchedules,
    showLessonChoose,
    showToggleLessonChoose,
    sendBotSiteURL,
    addHomeworkToLesson,
    addExamToLesson,
};
