const { Sequelize } = require('sequelize');
const { databaseSettings } = require('../../config');

const database = new Sequelize(databaseSettings.db, databaseSettings.user, databaseSettings.password, {
    host: databaseSettings.host,
    port: databaseSettings.port,
    dialect: databaseSettings.dialect,

    logging: false,
});

module.exports = database;