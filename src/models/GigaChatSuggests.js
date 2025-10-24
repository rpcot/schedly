const Sequelize = require('sequelize');
const database = require('../utils/structures/database.const');

module.exports = database.define('gigachat_suggests', {
    targetDayId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    targetLessonIndex: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    type: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    value: {
        type: Sequelize.STRING,
        allowNull: false,
    },
});