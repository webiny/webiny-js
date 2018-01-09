const _ = require('lodash');
const ValidationError = require('./../validationError');

/**
 * Only real numbers can pass this validator. 
 * Numeric strings will fail.
 * 
 * @param {any} value 
 */
module.exports = (value) => {
    if (!value && !_.isNaN(value)) return;

    if (_.isNumber(value) && !_.isNaN(value)) {
        return true;
    }

    throw new ValidationError('Value needs to be a number.');
};