const Sequelize = require('sequelize');
const database = require('../utils/structures/database.const');

module.exports = database.define('settings', {
    nextScheduleRotate: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
    },
}, {
    freezeTableName: true,
});