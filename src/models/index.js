const Days = require('./Days');
const Weeks = require('./Weeks');

Weeks.hasMany(Days, {
    foreignKey: 'weekId',
    as: 'days',
});

Days.belongsTo(Weeks, {
    foreignKey: 'weekId',
    as: 'week',
});

module.exports = {
    Weeks,
    Days,
    Settings: require('./Settings'),
    Users: require('./Users'),
};
