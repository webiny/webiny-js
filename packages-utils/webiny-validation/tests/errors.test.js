const {validation, ValidationError} = require('./../src');
import {assert} from 'chai';

describe('disabling Errors throwing test', () => {
	it('by default it must throw errors on invalid data', async () => {
		let error = null;
		try {
			await validation.validate('1234567890', 'required,email,minLength:5');
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, ValidationError);

		assert.isString(error.getMessage());
		assert.equal(error.getValidator(), 'email');
		assert.equal(error.getValue(), '1234567890');

		error.setMessage('123');
		error.setValidator('xyz');
		error.setValue('abc');

		assert.equal(error.getMessage(), '123');
		assert.equal(error.getValidator(), 'xyz');
		assert.equal(error.getValue(), 'abc');

	});

	it('should not throw errors when options\' throw flag is set to false', async () => {
		assert.isTrue(validation.validate('test', 'required', {throw: false, async: false}));
		assert.deepEqual(validation.validate('', 'required', {throw: false, async: false}), {
			"message": "Value is required.",
			"name": "required",
			"value": ""
		})

		assert.isTrue(await validation.validate('test', 'required', {throw: false}));
		assert.deepEqual(await validation.validate('', 'required', {throw: false}), {
			"message": "Value is required.",
			"name": "required",
			"value": ""
		})
	});
});