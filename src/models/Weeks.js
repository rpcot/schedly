const Sequelize = require('sequelize');
const database = require('../utils/structures/database.const');

module.exports = database.define('weeks', {
    date: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    number: {
        type: Sequelize.BIGINT,
        allowNull: false,
    },
});