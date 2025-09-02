const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { apiPort, apiHost, defaultBellsPath, weekUrlTemplate } = require('../config');
const { Weeks } = require('../models');
const { readFileSync } = require('fs');

function getDefaultBells() {
    return JSON.parse(readFileSync(defaultBellsPath, 'utf-8'));
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
        day.dataValues.today = new Date().toLocaleDateString('ru-RU').slice(0, 5) === day.date;
        day.dataValues.lessonsStartTime = lessonsStartTime;
        day.dataValues.lessonsEndTime = lessonsEndTime;

        const updatedLessons = [];
        let lessonIndex = 0
        for (const lesson of day.lessons) {
            lesson.bell = bells[lessonIndex];
            lesson.number = lessonIndex + 1;

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

const app = express();
const upload = multer();

app.use(express.json());

app.use(cors({
    origin: 'https://schedule.rpcot.ru',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
// app.use(cors({
//     origin: 'http://127.0.0.1:3000',
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
// }));

app.get('/', (req, res) => {
    res.status(200).json({ ok: true, status: 200, message: 'OK', version: '2.1.0' });
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
    } catch(e) {
        console.error(e);
        res.status(500).json({ ok: false, status: 500, message: 'Внутрення ошибка сервера' });
    }
});

app.get('/weeks/', upload.none(), async (req, res) => {
    try {
        const data = await getAllWeekDates();

        res.status(200).json({ ok: true, status: 200, data });
    } catch(e) {
        console.error(e);
        res.status(500).json({ ok: false, status: 500, message: 'Внутрення ошибка сервера' });
    }
});

app.use((req, res) => res.status(404).json({ ok: false, status: 404, message: 'Не найдено' }));

app.listen(apiPort, apiHost, () => {
    console.log(`[ИНФОРМАЦИЯ] API слушает по адресу http://${apiHost}:${apiPort}`);
    console.log('--------------------');
    console.log('   API запущено');
    console.log('--------------------');
});