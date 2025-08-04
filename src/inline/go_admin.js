const { sendGoAdminRequest, answerGoAdminRequest } = require("../utils/users-functions");

module.exports = {
    data: 'go_admin',
    async execute(bot, ctx, action, targetUserId) {
        if (action === 'go') {
            await sendGoAdminRequest(ctx);
        } else {
            await answerGoAdminRequest(ctx, action, targetUserId);
        }
    }
};
