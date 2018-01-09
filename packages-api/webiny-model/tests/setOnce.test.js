import {assert} from 'chai';
import Model from './../src/model';

describe('setOnce test', function () {
	it('shouldn\'t allow value change', async () => {
		const model = new Model(function () {
			this.attr('email').char().setValidators('required,email').setOnce();
			this.attr('something').char().setValidators('required');
		});

		await model.populate({email: 'john@gmail.com', something: 'cool'});

		model.something = 'warm';
		model.email = 'john2@gmail.com';

		assert.equal(model.something, 'warm');
		assert.equal(model.email, 'john@gmail.com');
	});
});