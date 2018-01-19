const {validation, ValidationError} = require('./../src');
import {assert} from 'chai';

describe('async/sync validation test', () => {
	it('by default it must validate asynchronously', async () => {
		const valid = validation.validate('test', 'required');
		assert.instanceOf(valid, Promise);
		assert.isTrue(await valid);

		let invalid = validation.validate('', 'required');
		assert.instanceOf(invalid, Promise);

		let error = null;
		try {
			await invalid;
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, ValidationError);

	});

	it('should validate synchronously when options\' async flag is set to false', async () => {
		assert.isTrue(validation.validate('test', 'required', {async: false}));

		let error = null;
		try {
			validation.validate('', 'required', {async: false});
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, ValidationError);
	});
});