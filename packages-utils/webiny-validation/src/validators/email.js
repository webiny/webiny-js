import ValidationError from './../validationError';

export default (value) => {
    if (!value) return;
    value = value + '';

	const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (!value || (value.length && re.test(value))) {
		return true;
	}
	throw new ValidationError('Value must be a valid e-mail address.');
};