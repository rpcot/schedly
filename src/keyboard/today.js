const { showScheduleDay } = require("../utils/schedule-functions");

module.exports = {
    data: '📅 Расписание на сегодня',
    async execute(bot, ctx) {
        if (ctx.chat.type !== 'private') return;
        
        await showScheduleDay(ctx, 'today');
    }
};
