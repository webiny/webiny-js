const ValidationError = require('./../validationError');

module.exports = (value) => {
    if (!value) return;
    value = value + '';

	const re = new RegExp('^\-?[0-9]+$');
	if ((re.test(value))) {
		return true;
	}
	throw new ValidationError('Value needs to be an integer.');
};