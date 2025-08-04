const { showScheduleDay } = require("../utils/schedule-functions");

module.exports = {
    data: '📅 Расписание на завтра',
    async execute(bot, ctx) {
        if (ctx.chat.type !== 'private') return;
        
        await showScheduleDay(ctx, 'tomorrow');
    }
};
