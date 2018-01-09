const _ = require('lodash');
const ValidationError = require('./../validationError');

module.exports = (value, params) => {
    if (!value) return;
    value = value + '';

    const regex = new RegExp(/^(https?:\/\/)((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i);
    const ipRegex = new RegExp(/^(https?:\/\/)(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);

    if (regex.test(value)) {
        if (!params.includes('noIp')) {
            return true;
        }

        if (!ipRegex.test(value)) {
            return true;
        }
    }

    throw new ValidationError('Value must be a valid URL.');
};