const {validation, ValidationError} = require('./../src');
import {assert} from 'chai';

describe('disabling Errors throwing test', () => {
	it('by default it must throw errors on invalid data', async () => {
		let error = null;
		try {
			await validation.validate('1234567890', 'xyz');
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, ValidationError);
		assert.equal(error.getValidator(), 'xyz');
	});
});