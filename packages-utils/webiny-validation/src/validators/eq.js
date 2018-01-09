const ValidationError = require('./../validationError');

module.exports = (value, equalTo) => {
    if (!value) return;
    value = value + '';

    // Intentionally put '==' instead of '===' because passed parameter for this validator is always sent inside a string (eg. "eq:test").
	if (value == equalTo) {
		return true;
	}
	throw new ValidationError('Value must be equal to ' + equalTo + '.');
};