const { generalChannelId } = require('../config');

async function getChatMember(userId) {
    const bot = require('../index');

    try {
        const chatMember = await bot.api.getChatMember(generalChannelId, userId);
        
        return chatMember;
    } catch (error) {
        return null;
    }
}

module.exports = {
    getChatMember,
};