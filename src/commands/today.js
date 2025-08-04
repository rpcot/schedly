const { showScheduleDay } = require("../utils/schedule-functions");

module.exports = {
    name: 'today',
    description: 'Посмотреть расписание на сегодня',
    async execute(bot, ctx) {

        await showScheduleDay(ctx, 'today');

    }
};
