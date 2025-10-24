const { giga: gigaConfig } = require("../../config");
const { GigaChat } = require('gigachat');

const gigaChat = new GigaChat({
    credentials: gigaConfig.key,
    scope: gigaConfig.scope,
    model: gigaConfig.model,
});

module.exports = gigaChat;