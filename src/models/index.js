const Days = require('./Days');
const Weeks = require('./Weeks');
const Attachments = require('./Attachments');

Weeks.hasMany(Days, {
    foreignKey: 'weekId',
    as: 'days',
});

Days.belongsTo(Weeks, {
    foreignKey: 'weekId',
    as: 'week',
});

Days.hasMany(Attachments, {
    foreignKey: 'dayId',
    as: 'attachments',
});

Attachments.belongsTo(Days, {
    foreignKey: 'dayId',
    as: 'day',
});

module.exports = {
    Weeks,
    Days,
    Attachments,
    Settings: require('./Settings'),
    Users: require('./Users'),
};
