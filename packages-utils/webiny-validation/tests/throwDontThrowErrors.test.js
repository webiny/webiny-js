const {validation} = require('./../src');
import {assert} from 'chai';

describe('disabling Errors throwing test', () => {
	it('by default it must throw errors on invalid data', async () => {
		try {
			await validation.validate('', 'required');
		} catch (e) {
			return;
		}

		throw Error(`Error should've been thrown.`);
	});

	it('should not throw errors when options\' throw flag is set to false', async () => {
		assert.isTrue(validation.validate('test', 'required', {throw: false, async: false}));
		assert.deepEqual(validation.validate('', 'required', {throw: false, async: false}), {
			"message": "Value is required.",
			"name": "required",
			"value": ""
		})
	});
});