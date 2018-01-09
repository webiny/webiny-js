const ValidationError = require('./../validationError');

module.exports = (value, parameters) => {
    if (!value) return;
    value = value + '';

    if (parameters.includes(value)) {
        return;
    }

	throw new ValidationError('Value must be one of the following: ' + parameters.join(', ') + '.');
};