const { Settings } = require("../models");

async function getSettings() {
    const bot = require('../index');
    
    const [data] = await Settings.findOrCreate({
        where: { id: 1 },
    });

    return data;
}

module.exports = {
    getSettings,
};
