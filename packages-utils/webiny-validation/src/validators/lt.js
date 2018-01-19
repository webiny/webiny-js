import ValidationError from './../validationError';

export default (value, max) => {
    if (!value) return;
    value = value + '';

	if (parseFloat(value) < parseFloat(max)) {
		return true;
	}

	throw new ValidationError('Value needs to be less than ' + max + '.');
};