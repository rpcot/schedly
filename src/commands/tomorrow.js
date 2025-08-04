const { showScheduleDay } = require("../utils/schedule-functions");

module.exports = {
    name: 'tomorrow',
    description: 'Посмотреть расписание на следующий день',
    async execute(bot, ctx) {

        await showScheduleDay(ctx, 'tomorrow');

    }
};
