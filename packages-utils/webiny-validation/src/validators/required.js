const _ = require('lodash');
const ValidationError = require('./../validationError');

module.exports = value => {
    if (_.isEmpty(value)) {
        if (_.isNumber(value)) {
            return;
        }
        throw new ValidationError('Value is required.');
    }
};