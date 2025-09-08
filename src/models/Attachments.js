const database = require('../utils/structures/database.const');
const Sequelize = require('sequelize');

module.exports = database.define('attachments', {
    value: {
        type: Sequelize.JSON,
        defaultValue: {},
    },
    name: {
        type: Sequelize.STRING,
    },
    mediaGroupId: {
        type: Sequelize.BIGINT,
    },
    lessonIndex: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
});