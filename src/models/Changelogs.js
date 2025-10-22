const database = require('../utils/structures/database.const');
const Sequelize = require('sequelize');

module.exports = database.define('changelogs', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        primaryKey: true,
        allowNull: false,
    },
    version: {
        type: Sequelize.STRING,
        validate: {
            is: {
                args: /^v\d+\.\d+\.\d+$/,
                msg: 'Неверный формат версии',
            },
        },
        allowNull: false,
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    type: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    involvedSystems: {
        type: Sequelize.JSON,
        defaultValue: [],
    },
    body: {
        type: Sequelize.JSON,
        defaultValue: [],
    },
    images: {
        type: Sequelize.JSON,
        defaultValue: [],
    },
    date: {
        type: Sequelize.DATE,
        allowNull: false,
    },
});