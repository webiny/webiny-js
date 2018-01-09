const ValidationError = require('./../validationError');

module.exports = (value) => {
    if (!value) return;
    value = value + '';

	const test = value.match(/^.{6,}$/);
	if (test === null) {
		throw new ValidationError('Password must contain at least 6 characters');
	}
	return true;
};