const ValidationError = require('./../validationError');

module.exports =  (value, max) => {
    if (!value) return;
    value = value + '';

	if (parseFloat(value) <= parseFloat(max)) {
		return true;
	}

	throw new ValidationError('Value needs to be less than or equal to ' + max + '.');
};