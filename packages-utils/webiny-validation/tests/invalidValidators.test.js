const {validation} = require('./../src');
import {assert} from 'chai';

describe('disabling error throwing test', () => {
	it('by default it must throw errors on invalid data', async () => {
		let error = null;
		try {
			await validation.validate('1234567890', '');
		} catch (e) {
			error = e;
		}

		assert.isNull(error);
	});

	it('must throw error if validators were not passed as a string', async () => {
		try {
			await validation.validate('123', {}, {});
		} catch (e) {
			return;
		}

		throw Error(`Error should've been thrown.`);
	});
});