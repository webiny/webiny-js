import {assert} from 'chai';

const {User, Size} = require('./models/userModels');
const user = new User();
user.populate({
	firstName: 'John',
	lastName: 'Doe',
	age: 15,
	company: {
		name: 'Webiny LTD',
		city: 'London',
		image: {
			file: 'webiny.jpg',
			size: {width: 12.5, height: 44},
			visible: false
		}
	}
});

describe('async get and set methods test', async function () {
	it('should correctly return simple values', async () => {
		assert.equal(await user.get('firstName'), 'John');
		assert.equal(await user.get('lastName'), 'Doe');
		assert.equal(await user.get('age'), 15);
	});

	it('should correctly return nested values', async () => {
		assert.equal(await user.get('company.name'), 'Webiny LTD');
		assert.equal(await user.get('company.city'), 'London');
		assert.instanceOf(await user.get('company.image.size'), Size);
		assert.equal(await user.get('company.image.size.width'), 12.5);
		assert.equal(await user.get('company.image.size.height'), 44);
		assert.isFalse(await user.get('company.image.visible'));
	});

	it('should return undefined', async () => {
		assert.isUndefined(await user.get('name2'));
		assert.isUndefined(await user.get('company.name2'));
		assert.isUndefined(await user.get('company.image.size.'));
		assert.isUndefined(await user.get('company.image.size.__'));
		assert.isUndefined(await user.get('company.image.size.width '));
	});

	it('should return instance of model', async () => {
		assert.isUndefined(await user.get(), User);
	});

	it('should correctly set simple values', async () => {
		await user.set('firstName', 'Jane');
		await user.set('lastName', 'Smith');
		await user.set('age', 30);

		assert.equal(await user.get('firstName'), 'Jane');
		assert.equal(await user.get('lastName'), 'Smith');
		assert.equal(await user.get('age'), 30);
	});

	it('should correctly return nested values', async () => {
		await user.set('company.name', 'Facebook');
		await user.set('company.city', 'San Francisco');
		assert.equal(await user.get('company.name'), 'Facebook');
		assert.equal(await user.get('company.city'), 'San Francisco');

		await user.set('company.image.size', {width: 50, height: 100});
		assert.instanceOf(await user.get('company.image.size'), Size);
		assert.equal(await user.get('company.image.size.width'), 50);
		assert.equal(await user.get('company.image.size.height'), 100);

		await user.set('company.image.size.width', 100);
		await user.set('company.image.size.height', 200);

		assert.instanceOf(await user.get('company.image.size'), Size);
		assert.equal(await user.get('company.image.size.width'), 100);
		assert.equal(await user.get('company.image.size.height'), 200);

		await user.set('company.image.visible', true);
		assert.isTrue(await user.get('company.image.visible'));
	});

	it('should not set anything since path is invalid', async () => {
		try {
			await user.set('name2', 111);
		} catch (e) {
			return;
		}

		throw Error(`Error should've been thrown.`);
	});
});