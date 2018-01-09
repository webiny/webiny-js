const ValidationError = require('./../validationError');

module.exports = (value, min) => {
    if (!value) return;
    value = value + '';

	if (parseFloat(value) >= parseFloat(min)) {
		return true;
	}
	throw new ValidationError('Value needs to be greater than or equal to ' + min + '.');
};