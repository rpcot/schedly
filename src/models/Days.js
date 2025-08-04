const Sequelize = require('sequelize');
const database = require('../utils/structures/database.const');

module.exports = database.define('days', {
    index: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    note: {
        type: Sequelize.TEXT,
        defaultValue: '',
    },
    lessons: {
        type: Sequelize.JSON,
        defaultValue: [],
    },
    holiday: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    bellsType: {
        type: Sequelize.STRING,
        defaultValue: 'default',
    },
    date: {
        type: Sequelize.STRING,
        allowNull: false,
    },
});