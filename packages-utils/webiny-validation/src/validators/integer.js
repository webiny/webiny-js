import _ from 'lodash';
import ValidationError from './../validationError';

export default (value) => {
    if (!value) return;

    if (_.isInteger(value)) {
        return true;
    }

    throw new ValidationError('Value needs to be an integer.');
};