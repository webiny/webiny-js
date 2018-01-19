import _ from 'lodash';
import ValidationError from './../validationError';

export default (value, length) => {
    if (!value) return;

	if (_.isObject(value)) {
		value = _.keys(value);
	}
	if (value.length && value.length >= length) {
		return true;
	}
	throw new ValidationError('Value requires at least ' + length + ' characters.');
};