const _ = require('lodash');
const ValidationError = require('./../validationError');

module.exports = (value, length) => {
    if (!value) return;

	if (_.isObject(value)) {
		value = _.keys(value);
	}
	if (value.length && value.length >= length) {
		return true;
	}
	throw new ValidationError('Value requires at least ' + length + ' characters.');
};