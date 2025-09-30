const lessonCardHTML = `<div class="lesson-card {lesson-cancelled} {highlighted} d-flex align-items-center mb-2 p-2 rounded-3 shadow-sm">
    <div class="lesson-number me-3 ms-1">{number}</div>
    <div class="lesson-info flex-grow-1">
        <b>{name}</b> <span class="lesson-time">({cabinet}) {bell}</span><br>
        <div>{homework}</div>
        <div>{attachments}</div>
        {exam}
    </div>
</div>`;

const lessonCardWithoutLessonsHTML = `<div class="lesson-card d-flex align-items-center mb-2 p-2 rounded-3 shadow-sm text-center">
    <div class="ms-1">
        <b>В данный день нет уроков</b>
    </div>
</div>`;

const selectWeekDivHTML = `<select class="form-select weekSelect mt-2" id="weekSelect">
                            <option selected disabled>Загрузка...</option>
                        </select>`;

const examHTML = '<div class="lesson-test">⚠️ Проверочная работа: {details}</div>';

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const queryParams = {};
    for (const [key, value] of params.entries()) {
        queryParams[key] = value;
    }
    return queryParams;
}

function getMondayAndSunday(currentWeek) {
    const previousSunday = new Date();
    const day = previousSunday.getDay();

    previousSunday.setDate(previousSunday.getDate() - ((day === 0) ? 7 : day));

    if (!currentWeek) {
        previousSunday.setDate(previousSunday.getDate() + 7);
    }

    previousSunday.setDate(previousSunday.getDate() + 1);
    const monday = new Date(previousSunday);

    previousSunday.setDate(previousSunday.getDate() + 6);
    const sunday = new Date(previousSunday);

    return { sunday: sunday.toLocaleDateString('ru-RU').slice(0, 5), monday: monday.toLocaleDateString('ru-RU').slice(0, 5) };
}

async function fetchDays() {

    const queryParams = getQueryParams();
    const weekNumber = queryParams.week;

    document.querySelectorAll('#select-week-div').forEach((value) => {
        value.innerHTML = selectWeekDivHTML;
    });

    document.querySelectorAll('#weekSelect').forEach((value) => {
        value.addEventListener('change', (event) => {
            const selectedUrl = event.target.value;
            window.location.href = selectedUrl;
        });
    });

    const dayIds = [
        'monday', 'tuesday', 'wednesday',
        'thursday', 'friday', 'saturday',
    ];

    const query = (!weekNumber)
        ? ''
        : `weekNumber=${weekNumber}`;

    // fetch(`http://127.0.0.1:4444/schedule?${query}`, {
    //     method: 'GET',
    // })
    fetch(`https://api.schedule.rpcot.ru/schedule?${query}`, {
        method: 'GET',
    })
        .then(async response => {
            const data = await response.json();

            if (data.status === 404) {
                // window.location.href = 'http://127.0.0.1:3000/html/schedule.html';
                window.location.href = 'https://schedule.rpcot.ru/schedule';
                return;
            }

            // fetch(`http://127.0.0.1:4444/weeks`, {
            //     method: 'GET',
            // })
            fetch(`https://api.schedule.rpcot.ru/weeks`, {
                method: 'GET',
            })
                .then(async weekResponse => {
                    const weeks = await weekResponse.json();

                    const [weekSelect1, weekSelect2] = document.querySelectorAll('#weekSelect');

                    weekSelect1.innerHTML = '';
                    weekSelect2.innerHTML = '';
                    for (const week of weeks.data) {
                        weekSelect1.innerHTML += `<option value="${week.url}" ${week.number == data.data.week.number ? 'selected disabled' : ''}>${week.date}</option>`;
                        weekSelect2.innerHTML += `<option value="${week.url}" ${week.number == data.data.week.number ? 'selected disabled' : ''}>${week.date}</option>`;
                    }
                })
                .catch((error) => {
                    if (error.message === 'Failed to fetch') {
                        console.error('Ошибка сети:', error);
                        alert('Ошибка сети, попробуйте ещё раз или подождите некоторое количество времени.');
                    } else {
                        console.error(error);
                        alert(`Возникла непредвиденная ошибка. Свяжитесь с разработчиком.\n${error.stack}`);
                    }
                })

            const weekText = document.getElementById('week-text');
            weekText.innerText = `неделю ${data.data.week.date}`;

            let todayDayId = null;
            for (const day of data.data.days) {
                const dayId = dayIds[day.index];

                const lessonsStarts = document.getElementById(`${dayId}-lessons-starts`);
                const lessonsEnds = document.getElementById(`${dayId}-lessons-ends`);
                const card = document.getElementById(`${dayId}-card`);
                const date = document.getElementById(`${dayId}-date`);
                const currentDayText = document.getElementById(`${dayId}-current-day-text`);
                const lessons = document.getElementById(`${dayId}-lessons`);
                const note = document.getElementById(`${dayId}-note`);

                date.innerText = day.date;

                if (day.today) {
                    card.classList.add('current-day');
                    currentDayText.innerText = '(сегодня)';
                    todayDayId = dayId;
                }

                if (day.note) {
                    note.innerText = day.note;
                }

                if (day.holiday) {
                    lessons.innerHTML = lessonCardWithoutLessonsHTML;
                } else {
                    lessonsStarts.innerText = day.lessonsStartTime;
                    lessonsEnds.innerText = day.lessonsEndTime;

                    if (day.lessons.length > 0) {
                        let lessonsHTML = '';
                        for (const lesson of day.lessons) {
                            let lessonCard = lessonCardHTML;

                            if (lesson.number % 2 === 0) {
                                lessonCard = lessonCard.replace('{highlighted}', 'highlighted');
                            } else {
                                lessonCard = lessonCard.replace('{highlighted}', '');
                            }

                            if (lesson.exam) {
                                lessonCard = lessonCard.replace('{exam}', examHTML.replace('{details}', lesson.exam));
                            } else {
                                lessonCard = lessonCard.replace('{exam}', '');
                            }

                            if (lesson.canceled) {
                                lessonCard = lessonCard
                                    .replace('{lesson-cancelled}', 'lesson-cancelled')
                                    .replace('{number}', '<i class="bi bi-x-circle"></i>');
                            } else {
                                lessonCard = lessonCard
                                    .replace('{lesson-cancelled}', '')
                                    .replace('{cancelled}', '')
                                    .replace('{number}', lesson.number);
                            }

                            const attachmentsString = lesson.attachments.map((data) => {
                                return `<a class="link" href="${data.url}" target="_blank">${data.name}</a>`
                            }).join(' • ');

                            lessonCard = lessonCard
                                .replace('{name}', lesson.name)
                                .replace('{cabinet}', lesson.cabinet)
                                .replace('{bell}', lesson.bell)
                                .replace('{homework}', lesson.homework.join('<br>') || 'Домашнее задание не указано')
                                .replace('{attachments}', (attachmentsString) ? `└─ ${attachmentsString}` : '');

                            lessonsHTML += lessonCard;
                        }

                        lessons.innerHTML = lessonsHTML;
                    }
                }
            }

            if (todayDayId) {
                const todayDayCard = document.getElementById(`${todayDayId}-card`);
                todayDayCard.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }
        })
        .catch(error => {
            if (error.message === 'Failed to fetch') {
                console.error('Ошибка сети:', error);
                alert('Ошибка сети, попробуйте ещё раз или подождите некоторое количество времени.');
            } else {
                console.error(error);
                alert(`Возникла непредвиденная ошибка. Свяжитесь с разработчиком.\n${error.stack}`);
            }
        });

}

window.addEventListener('DOMContentLoaded', fetchDays);