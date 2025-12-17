const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { token, apiPort, apiHost, defaultBellsPath, weekUrlTemplate, attachmentUrlTemplate, changelogConfigPath, holidaysConfigPath } = require('../config');
const { Weeks, Attachments, Changelogs } = require('../models');
const { readFileSync } = require('fs');
const { Bot } = require('grammy');

const bot = new Bot(token);

const metaMap = {
    index: {
        title: 'Расписание — SCHEDLY',
        description: 'Расписание уроков.',
        keywords: 'SCHEDLY, расписание, Telegram-бот',
    },
    info: {
        title: 'Информация — SCHEDLY',
        description: 'Информация о проекте SCHEDLY — Telegram-боте для управления расписанием.',
        keywords: 'SCHEDLY, расписание, Telegram-бот, информация, проект',
    },
    holidays: {
        title: 'Каникулы — SCHEDLY',
        description: 'Расписание и обратный отсчёт до каникул и праздников.',
        keywords: 'SCHEDLY, расписание, Telegram-бот, каникулы, праздники',
    },
    updates: {
        title: 'Обновления — SCHEDLY',
        description: 'Список изменений бота и его сервисов.',
        keywords: 'SCHEDLY, Telegram-бот, обновления, изменения',
    },
    update: {
        title: 'Подробности обновления — SCHEDLY',
        description: 'Подробное описание изменений обновления.',
        keywords: 'SCHEDLY, Telegram-бот, обновления, изменения',
    },
    notFound: {
        title: 'Страница не найдена — SCHEDLY',
        description: 'Запрашиваемая страница не найдена',
        keywords: 'SCHEDLY, расписание, Telegram-бот, информация, проект',
    },
};

function getDefaultBells() {
    return JSON.parse(readFileSync(defaultBellsPath, 'utf-8'));
}

function getChangelogsConfig() {
    return JSON.parse(readFileSync(changelogConfigPath, 'utf-8'));
}

function getHolidays() {
    return JSON.parse(readFileSync(holidaysConfigPath, 'utf-8'));
}

async function getData(week) {
    const weekDays = await week.getDays();
    const days = [];

    const defaultBells = getDefaultBells();

    for (const day of weekDays) {
        const bells = defaultBells[day.bellsType].intervals;

        const firstNotCanceledLesson = day.lessons
            .filter((lesson) => !lesson.canceled)[0];
        const indexOfFirstNotCanceledLesson = day.lessons.indexOf(firstNotCanceledLesson);
        const lessonsStartTime = bells[indexOfFirstNotCanceledLesson]?.split('-')?.[0] || 'неизвестно';

        const lastNotCanceledLesson = day.lessons
            .filter((lesson) => !lesson.canceled)
            .slice(-1)[0];
        const indexOfLastNotCanceledLesson = day.lessons.indexOf(lastNotCanceledLesson);
        const lessonsEndTime = bells[indexOfLastNotCanceledLesson]?.split('-')?.[1] || 'неизвестно';

        day.dataValues.date = day.date;
        day.dataValues.today = new Date().toLocaleDateString('ru-RU') === day.date;
        day.dataValues.lessonsStartTime = lessonsStartTime;
        day.dataValues.lessonsEndTime = lessonsEndTime;

        const updatedLessons = [];
        let lessonIndex = 0
        for (const lesson of day.lessons) {
            lesson.bell = bells[lessonIndex];
            lesson.number = lessonIndex + 1;

            const updatedAttachments = [];
            for (const attachment of lesson?.attachments || []) {
                const attachmentData = await getAttachment(attachment.id);
                if (!attachmentData) continue;

                updatedAttachments.push({
                    name: attachmentData.name || `Вложение ${attachmentData.id}`,
                    id: attachment.id,
                    url: (attachmentData.value.type === 'link')
                        ? attachmentData.value.content
                        : `${attachmentUrlTemplate}${attachmentData.id}`,
                });
            }

            lesson.attachments = updatedAttachments;

            updatedLessons.push(lesson);

            lessonIndex++;
        }
        day.dataValues.lessons = updatedLessons;

        days.push(day.dataValues);
    }

    return days;
}

async function getWeekByNumber(number) {
    const data = await Weeks.findOne({ where: { number } });

    return data;
}

async function getAllWeeks() {
    const data = await Weeks.findAll();

    return data;
}

async function getAllWeekDates() {
    const weeks = await getAllWeeks();

    const data = [];
    let count = 1;
    for (const week of weeks) {
        const countDiff = weeks.length - count;

        let date = week.date;
        switch (countDiff) {
            case 3:
                date = `Предыдущая (${week.date})`;
                break;
            case 2:
                date = `Текущая (${week.date})`;
                break;
            case 1:
                date = `Следующая (${week.date})`;
                break;
            case 0:
                date = `Через две (${week.date})`;
                break;
        }

        data.unshift(
            { number: week.number, date, url: `${weekUrlTemplate}${week.number}` }
        );

        count++;
    }

    return data;
}

async function getCurrentWeek() {
    const weeks = await Weeks.findAll({
        order: [['number', 'DESC']],
        limit: 3,
    });

    const data = weeks[2];

    return data;
}

async function getAllChangelogs() {
    const changelogsData = await Changelogs.findAll({
        attributes: [
            'id', 'version', 'title', 'type',
            'type', 'involvedSystems', 'body',
            'images', 'date',
        ],
        raw: true,
        order: [['date', 'DESC']],
    });

    const { systems } = getChangelogsConfig();

    return changelogsData.map((data) => {
        data.body = data.body.map((system) => {
            return { ...system, name: systems[system.systemId].name };
        });
        return data;
    });
}

async function getChangelogData(id) {
    const changelogData = await Changelogs.findByPk(id, {
        attributes: [
            'id', 'version', 'title', 'type',
            'type', 'involvedSystems', 'body',
            'images', 'date',
        ],
        raw: true,
    });

    const { systems } = getChangelogsConfig();

    if (!changelogData)
        return null;

    changelogData.body = changelogData.body.map((system) => {
        return { ...system, name: systems[system.systemId].name };
    });

    return changelogData;
}

async function getAttachment(id) {
    const attachmentData = await Attachments.findByPk(id);

    return attachmentData;
}

async function getFileFromTelegram(fileId) {
    const file = await bot.api.getFile(fileId);

    const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    const response = await fetch(url);

    return response;
}

const app = express();
const upload = multer();

app.use(express.json());

app.use(cors({
    origin: [
        'https://schedule.rpcot.ru',
        'https://schedly.rpcot.ru',
        'https://schedule-old.rpcot.ru',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
// app.use(cors());

app.get('/', (req, res) => {
    res.status(200).json({ ok: true, status: 200, message: 'OK', version: '2.4.0' });
});

app.get('/schedule/', upload.none(), async (req, res) => {
    try {
        const week = (!req.query?.weekNumber)
            ? await getCurrentWeek()
            : await getWeekByNumber(req.query.weekNumber);

        if (!week)
            return void res.status(404).json({ ok: false, status: 404, message: 'Ничего не найдено' });

        const data = await getData(week);

        res.status(200).json({ ok: true, status: 200, data: { days: data, week } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, status: 500, message: 'Внутрення ошибка сервера' });
    }
});

app.get('/weeks/', upload.none(), async (req, res) => {
    try {
        const data = await getAllWeekDates();

        res.status(200).json({ ok: true, status: 200, data });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, status: 500, message: 'Внутрення ошибка сервера' });
    }
});

app.get('/attachment/:id', upload.none(), async (req, res) => {
    const id = req.params.id;

    try {
        const attachmentData = await getAttachment(id);
        if (!attachmentData)
            return void res.status(404).json({ ok: false, status: 404, message: 'Вложение не найдено' });

        const response = await getFileFromTelegram(attachmentData.value.fileId);
        if (!response.ok)
            return void res.status(500).json({ ok: false, status: 500, message: 'Внутрення ошибка сервера' });

        const dispositionType = (attachmentData.value.type === 'document')
            ? 'attachment'
            : 'inline';

        const buffer = Buffer.from(await response.arrayBuffer());

        res.setHeader("Content-Type", attachmentData.value.mimeType || "application/octet-stream");
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", buffer.length);
        try {
            res.setHeader("Content-Disposition", `${dispositionType}; filename="${attachmentData.value.fileName}"`);
        } catch (_) {
            const fileName = `file.${attachmentData.value.fileName.split('.')[1]}`;
            res.setHeader("Content-Disposition", `${dispositionType}; filename="${fileName}"`);
        }

        res.send(buffer);
    } catch (e) {
        console.error(e);
        if (e.message.includes('file is too big')) {
            res.status(500).send('Не удалось скачать вложение. Пожалуйста, попробуйте сделать это через бота с помощью команды /today или /tomorrow.');
        } else {
            res.status(500).json({ ok: false, status: 500, message: 'Внутрення ошибка сервера' });
        }
    }
});

app.get('/changelogs', upload.none(), async (req, res) => {
    try {
        const data = await getAllChangelogs();

        res.status(200).json({
            ok: true,
            status: 200,
            data,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, status: 500, message: 'Внутрення ошибка сервера' });
    }
});

app.get('/changelogs/:id', upload.none(), async (req, res) => {
    try {
        const id = req.params.id;

        const data = await getChangelogData(id);

        if (!data)
            return void res.status(404).json({ ok: false, status: 404, message: 'Не найдено' });

        res.status(200).json({
            ok: true,
            status: 200,
            data,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, status: 500, message: 'Внутрення ошибка сервера' });
    }
});

app.get('/holidays', upload.none(), async (req, res) => {
    try {
        const data = getHolidays();

        res.status(200).json({
            ok: true,
            status: 200,
            data,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, status: 500, message: 'Внутрення ошибка сервера' });
    }
});

app.get(['/meta', '/meta/*'], (req, res) => {
    const path = req.params[0] || '';

    let metaKey = 'notFound';
    switch (true) {
        case path === '':
            metaKey = 'index';
            break;
        case path === 'info':
            metaKey = 'info';
            break;
        case path === 'holidays':
            metaKey = 'holidays';
            break;
        case path === 'updates':
            metaKey = 'updates';
            break;
        case path.startsWith('updates/'):
            metaKey = 'update';
            break;
    }

    const meta = metaMap[metaKey];

    res.status(metaKey === 'notFound' ? 404 : 200)
        .send(`<!DOCTYPE html>
        <html lang="ru">
            <head>
                <meta charset="utf-8" />
                <title>${meta.title}</title>

                <meta name="theme-color" content="#0d0d0d" />

                <meta property="og:locale" content="ru_RU" />
                <meta property="og:site_name" content="SCHEDLY" />
                <meta property="og:type" content="website" />
                <meta property="og:image" content="https://api.rpcot.ru/images/rasp-logo" />

                <meta name="description" content="${meta.description}" />
                <meta name="keywords" content="${meta.keywords}" />

                <meta property="og:title" content="${meta.title}" />
                <meta property="og:description" content="${meta.description}" />
            </head>
            <body></body>
        </html>`);
});

app.use((req, res) => res.status(404).json({ ok: false, status: 404, message: 'Не найдено' }));

app.listen(apiPort, apiHost, () => {
    console.log(`[ИНФОРМАЦИЯ] API слушает по адресу http://${apiHost}:${apiPort}`);
    console.log('--------------------');
    console.log('   API запущено');
    console.log('--------------------');
});