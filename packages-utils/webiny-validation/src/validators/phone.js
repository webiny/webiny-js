const ValidationError = require('./../validationError');

module.exports = (value) => {
    if (!value) return;
    value = value + '';

	if (value.match(/^[-+0-9()/\s]+$/)) {
		return true;
	}
	throw new ValidationError('Value must be a valid phone number.');
};