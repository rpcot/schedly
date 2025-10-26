const holidayIds = ['autumn', 'winter', 'spring', 'summer'];
const counterIds = ['newYear', 'summer'];

const errorMessage = '❌ Ошибка при обработке данных';

function isDateBetweenDates(targetDate, date1, date2) {
    return targetDate >= date1 && targetDate <= date2;
}

function plural(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return `${titles[number % 100 > 4 && number % 100 < 20 ? 2 : cases[number % 10 < 5 ? number % 10 : 5]]}`;
}

function getPreciseDatesDiff(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const result = { years: 0, months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

    let current = new Date(start);

    while (new Date(current.getFullYear() + 1, current.getMonth(), current.getDate()) <= end) {
        current.setFullYear(current.getFullYear() + 1);
        result.years++;
    }

    while (new Date(current.getFullYear(), current.getMonth() + 1, current.getDate()) <= end) {
        current.setMonth(current.getMonth() + 1);
        result.months++;
    }

    let diffMs = end - current;
    let sec = Math.floor(diffMs / 1000);

    result.weeks = Math.floor(sec / (7 * 24 * 3600));
    sec %= 7 * 24 * 3600;

    result.days = Math.floor(sec / (24 * 3600));
    sec %= 24 * 3600;

    result.hours = Math.floor(sec / 3600);
    sec %= 3600;

    result.minutes = Math.floor(sec / 60);
    result.seconds = sec % 60;

    return result;
}


function getTimeStringView(end, format, length = 'short') {
    const now = new Date();

    const diff = getPreciseDatesDiff(now, end);

    const { years, months, weeks, days, hours, minutes, seconds } = diff;

    if (length === 'short') {
        return format
            .replace('yy', years ? `${years} г. ` : '')
            .replace('mo', months ? `${months} мес. ` : '')
            .replace('ww', weeks ? `${weeks} нед. ` : '')
            .replace('dd', days ? `${days} д. ` : '')
            .replace('hh', hours ? `${hours} ч. ` : '')
            .replace('mm', minutes ? `${minutes} мин. ` : '')
            .replace('ss', (!years && !months && !weeks && !days && !hours && !minutes && !seconds) ? '0 сек.' : 'ss')
            .replace('ss', seconds ? `${seconds} сек. ` : '');
    } else if (length === 'long') {
        return format
            .replace('yy', years ? `${years} ${plural(years, ['год', 'года', 'лет'])} ` : '')
            .replace('mo', months ? `${months} ${plural(months, ['месяц', 'месяца', 'месяцев'])} ` : '')
            .replace('ww', weeks ? `${weeks} ${plural(weeks, ['неделя', 'недели', 'недель'])} ` : '')
            .replace('dd', days ? `${days} ${plural(days, ['день', 'дня', 'дней'])} ` : '')
            .replace('hh', hours ? `${hours} ${plural(hours, ['час', 'часа', 'часов'])} ` : '')
            .replace('mm', minutes ? `${minutes} ${plural(minutes, ['минута', 'минуты', 'минут'])} ` : '')
            .replace('ss', (!years && !months && !weeks && !days && !hours && !minutes && !seconds) ? '0 секунд' : 'ss')
            .replace('ss', seconds ? `${seconds} ${plural(seconds, ['секунда', 'секунды', 'секунд'])} ` : '');
    }
}

function calculateHolidays(data) {
    for (const [id, { start, end }] of Object.entries(data.holidays)) {
        const startDate = new Date(start);
        const endDate = new Date(end);

        startDate.setHours(0);
        endDate.setHours(0);

        const scheduleElement = document.getElementById(`${id}-holiday-schedule`);
        const counterElement = document.getElementById(`${id}-holiday-counter`);

        const getDateStringView = (date) => date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

        const startDateStringView = getDateStringView(startDate);
        const endDateStringView = getDateStringView(endDate);
        scheduleElement.innerHTML = `С ${startDateStringView} по ${endDateStringView}`;

        if (new Date() < startDate) {
            const timeStringView = getTimeStringView(startDate, 'yymowwddhhmmss', 'short');
            counterElement.innerHTML = `Через ${timeStringView}`;
        } else if (isDateBetweenDates(new Date(), startDate, endDate)) {
            counterElement.innerHTML = 'Идут прямо сейчас';
        } else {
            counterElement.innerHTML = 'Уже прошли';
        }
    }
}

function calculateCounters(data) {
    for (const [id, { start, plug }] of Object.entries(data.counters)) {
        const startDate = new Date(start);

        const counterElement = document.getElementById(`${id}-counter`);
        if (new Date() < startDate) {
            const timeStringView = getTimeStringView(startDate, 'yymowwddhhmmss', 'long');
            counterElement.innerHTML = timeStringView;
        } else {
            counterElement.innerHTML = plug;
        }
    }
}

function updateUI(data) {
    calculateHolidays(data);
    calculateCounters(data);
}

async function fetchData() {
    // const response = await fetch('http://127.0.0.1:4444/holidays', {
    //     method: 'GET',
    // });
    const response = await fetch('https://api.schedule.rpcot.ru/holidays', {
        method: 'GET',
    });

    if (!response.ok)
        throw new Error('Network response was not ok');

    const responseData = await response.json();
    if (!responseData.ok)
        throw new Error('API response was not ok');

    const data = responseData.data;

    updateUI(data);
    setInterval(() => updateUI(data), 1000);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await fetchData();
    } catch (error) {
        holidayIds.forEach(id => {
            const scheduleElement = document.getElementById(`${id}-holiday-schedule`);
            scheduleElement.innerHTML = errorMessage;
        });
        counterIds.forEach(id => {
            const counterElement = document.getElementById(`${id}-counter`);
            counterElement.innerHTML = errorMessage;
        });
    } finally {
        document.querySelectorAll('#spinner').forEach(spinner => {
            spinner.style.display = 'none';
        });
    }
});