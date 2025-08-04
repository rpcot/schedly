const { readFileSync } = require('fs');
const { defaultPrefixesPath } = require('../config');

function getDefaultPrefixes() {
    return JSON.parse(readFileSync(defaultPrefixesPath, 'utf8'));
}

module.exports = {
    getDefaultPrefixes,
};
