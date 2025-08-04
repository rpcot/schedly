const { setGroup, showUserManagePanel } = require("../utils/users-functions");

module.exports = {
    data: 'user_manage',
    async execute(bot, ctx, targetUserId, action, subAction) {

        if (action === 'admin') {
            if (subAction === 'take') {
                await setGroup(targetUserId, 'user');

                await ctx.api.sendMessage(targetUserId, `С тебя <b>были сняты</b> админ права`, {
                    parse_mode: 'HTML',
                }).catch(() => { });
            } else if (subAction === 'set') {
                await setGroup(targetUserId, 'admin');

                await ctx.api.sendMessage(targetUserId, `Тебе <b>были выданы</b> админ права`, {
                    parse_mode: 'HTML',
                }).catch(() => { });
            }
        }

        await showUserManagePanel(ctx, targetUserId, { reply: false });

    }
};
