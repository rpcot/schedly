const Sequelize = require('sequelize');
const database = require('../utils/structures/database.const');

module.exports = database.define('users', {
    userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
    },
    prefix: {
        type: Sequelize.STRING,
    },
    group: {
        type: Sequelize.STRING,
        defaultValue: 'user',
    },
    wait: {
        type: Sequelize.JSON,
        defaultValue: {},
    },
});