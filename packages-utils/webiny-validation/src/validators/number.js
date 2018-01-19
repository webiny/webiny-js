import _ from 'lodash';
import ValidationError from './../validationError';

/**
 * Only real numbers can pass this validator. 
 * Numeric strings will fail.
 * 
 * @param {any} value 
 */
export default (value) => {
    if (!value && !_.isNaN(value)) return;

    if (_.isNumber(value) && !_.isNaN(value)) {
        return true;
    }

    throw new ValidationError('Value needs to be a number.');
};