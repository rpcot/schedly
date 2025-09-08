function plural(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return `${titles[number % 100 > 4 && number % 100 < 20 ? 2 : cases[number % 10 < 5 ? number % 10 : 5]]}`;
}

module.exports = {

    waitMillisecond(ms) {
        const start = new Date().getTime();
        let end = start;
        while (end < start + ms) {
            end = new Date().getTime();
        }
    },

    waitSecond(s) {
        const start = Math.floor(new Date().getTime() / 1000);
        let end = start;
        while (end < start + s) {
            end = Math.floor(new Date().getTime() / 1000);
        }
    },

    getTimestamp(secAdd = 0) {
        return Math.floor(new Date().getTime() / 1000) + secAdd;
    },

    getTimestampFromDate(date, secAdd = 0) {
        return Math.floor(date.getTime() / 1000) + secAdd;
    },

    randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    isUrl(string) {
        let url;
        try {
            url = new URL(string);
        } catch (_) {
            return false;
        }
        return url.protocol === "http:" || url.protocol === "https:";
    },

    getStringTime(sec, format, length = 'short') {

        const years = Math.floor(sec / (365 * 24 * 3600));
        sec %= 365 * 24 * 3600;

        const months = Math.floor(sec / (30 * 24 * 3600));
        sec %= 30 * 24 * 3600;

        const weeks = Math.floor(sec / (7 * 24 * 3600));
        sec %= 7 * 24 * 3600;

        const days = Math.floor(sec / (24 * 3600));
        sec %= 24 * 3600;

        const hours = Math.floor(sec / 3600);
        sec %= 60 * 60;

        const minutes = Math.floor(sec / 60);
        sec %= 60;

        const seconds = sec;

        if (length === 'short') {
            return format
                .replace('yy', (years > 0) ? `${years} г. ` : '')
                .replace('mo', (months > 0) ? `${months} мес. ` : '')
                .replace('ww', (weeks > 0) ? `${weeks} нед. ` : '')
                .replace('dd', (days > 0) ? `${days} д. ` : '')
                .replace('hh', (hours > 0) ? `${hours} ч. ` : '')
                .replace('mm', (minutes > 0) ? `${minutes} мин. ` : '')
                .replace('ss', (years + months + weeks + days + hours + minutes + seconds === 0) ? '0 сек.' : 'ss')
                .replace('ss', (seconds > 0) ? `${seconds} сек. ` : '');
        } else if (length === 'long') {
            return format
                .replace('yy', (years > 0) ? `${years} ${plural(years, ['год', 'года', 'лет'])} ` : '')
                .replace('mo', (months > 0) ? `${months} ${plural(months, ['месяц', 'месяца', 'месяцев'])} ` : '')
                .replace('ww', (weeks > 0) ? `${weeks} ${plural(weeks, ['неделя', 'недели', 'недель'])} ` : '')
                .replace('dd', (days > 0) ? `${days} ${plural(days, ['день', 'дня', 'дней'])} ` : '')
                .replace('hh', (hours > 0) ? `${hours} ${plural(hours, ['час', 'часа', 'часов'])} ` : '')
                .replace('mm', (minutes > 0) ? `${minutes} ${plural(minutes, ['минута', 'минуты', 'минут'])} ` : '')
                .replace('ss', (years + months + weeks + days + hours + minutes + seconds === 0) ? '0 секунд' : 'ss')
                .replace('ss', (seconds > 0) ? `${seconds} ${plural(seconds, ['секунда', 'секунды', 'секунд'])} ` : '');
        }

    },

    getOnesStringTime(sec) {

        const years = Math.floor(sec / (365 * 24 * 3600));
        sec %= 365 * 24 * 3600;

        const months = Math.floor(sec / (30 * 24 * 3600));
        sec %= 30 * 24 * 3600;

        const weeks = Math.floor(sec / (7 * 24 * 3600));
        sec %= 7 * 24 * 3600;

        const days = Math.floor(sec / (24 * 3600));
        sec %= 24 * 3600;

        const hours = Math.floor(sec / 3600);
        sec %= 60 * 60;

        const minutes = Math.floor(sec / 60);
        sec %= 60;

        const seconds = sec;

        if (years > 0) return `${years} ${plural(years, ['год', 'года', 'лет'])}`;
        else if (months > 0) return `${months} ${plural(months, ['месяц', 'месяца', 'месяцев'])}`;
        else if (weeks > 0) return `${weeks} ${plural(weeks, ['неделя', 'недели', 'недель'])}`;
        else if (days > 0) return `${days} ${plural(days, ['день', 'дня', 'дней'])}`;
        else if (hours > 0) return `${hours} ${plural(hours, ['час', 'часа', 'часов'])}`;
        else if (minutes > 0) return `${minutes} ${plural(minutes, ['минута', 'минуты', 'минут'])}`;
        else return `${seconds} ${plural(seconds, ['секунда', 'секунды', 'секунд'])}`;

    },

    isColor(str) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(str);
    },

    getDateWithString(string) {
        try {
            const splitString = string.split(' ');
            const [day, month] = splitString[0].split('.').map(v => Number(v));
            const [hour, min] = splitString[1].split(':').map(v => Number(v));
            const currentDate = new Date();
            const date = new Date(currentDate.getFullYear(), month - 1, day, hour, min);
            if (date.toString() === 'Invalid Date') return;
            return date;
        } catch (_) {
            return;
        }

    },

    convertTimeToSeconds(time) {
        const regex = /(\d+)([dmyhosw]+)/g;
        const matches = time.matchAll(regex);
        let totalSeconds = 0;

        for (const match of matches) {
            const value = parseInt(match[1].slice(0, match[0].length - 1));
            const unit = (match[2].endsWith('mo')) ? match[2].slice(-2) : match[2].slice(-1);

            switch (unit) {
                case 'y':
                    totalSeconds += value * 365 * 24 * 60 * 60;
                    break;
                case 'mo':
                    totalSeconds += value * 30 * 24 * 60 * 60;
                    break;
                case 'w':
                    totalSeconds += value * 7 * 24 * 60 * 60;
                    break;
                case 'd':
                    totalSeconds += value * 24 * 60 * 60;
                    break;
                case 'h':
                    totalSeconds += value * 60 * 60;
                    break;
                case 'm':
                    totalSeconds += value * 60;
                    break;
                case 's':
                    totalSeconds += value;
                    break;
                default:
                    continue;
            }
        }

        return totalSeconds;

    },

    generateId(length) {

        const symbols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        let id = '';
        for (let i = 0; i < length; i++) {

            const symbol = symbols[Math.floor(Math.random() * symbols.length)];

            id += symbol;

        }

        return id;

    },

    getStringWithDate(date = new Date()) {

        const day = ('0' + date.getDate()).slice(-2);

        const month = ('0' + (date.getMonth() + 1)).slice(-2);

        const year = date.getFullYear();

        const hour = ('0' + date.getHours()).slice(-2);

        const minute = ('0' + date.getMinutes()).slice(-2);

        const second = ('0' + date.getSeconds()).slice(-2);

        const time = `${day}.${month}.${year} ${hour}:${minute}:${second}`;

        return time;

    },

    async errorAnswer(ctx, text, { deleteAfter, keyboard = {} } = {}) {

        const msg = await ctx.reply(`⚠️ ${text}`, {
            reply_markup: keyboard,
            parse_mode: 'HTML',
        });

        if (deleteAfter > 0) {
            setTimeout(async () => {
                await ctx.api.deleteMessage(ctx.chat.id, msg.message_id)
                    .catch(() => { });
            }, deleteAfter * 1000);
        }

        return msg;

    },

    capitalize(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    plural,

}