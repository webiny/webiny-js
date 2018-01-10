import {assert} from 'chai';

const extractor = require('./../src');

const data = {
	firstName: 'John',
	lastName: 'Doe',
	age: 30,
	enabled: true,
	company: {
		name: 'Webiny LTD',
		city: 'London',
		image: {
			file: 'webiny.jpg',
			size: {width: 12.5, height: 44},
			visible: false
		}
	},
	subscription: {
		name: 'Free',
		price: 0,
		commitment: {
			expiresOn: 'never'
		}
	},
	objects: [
		{type: 'cube', size: 'large', weight: 'heavy'},
		{type: 'sphere', size: 'medium', weight: 'medium-heavy'},
		{type: 'pyramid', size: 'small', weight: 'light'}
	],
	promised: new Promise(resolve => {
		setTimeout(() => {
			resolve(100);
		}, 5);
	})
};

describe('extracting values test', () => {
	it('should return regular root keys', async () => {
		const extracted = await extractor.get(data, 'firstName,lastName,enabled');
		assert.equal(extracted.firstName, 'John');
		assert.equal(extracted.lastName, 'Doe');
		assert.equal(extracted.enabled, true);
	});

	it('should return nested keys - marked with dots', async () => {
		const extracted = await extractor.get(data, 'subscription.name,subscription.price,subscription.commitment.expiresOn');
		assert.equal(extracted.subscription.name, 'Free');
		assert.equal(extracted.subscription.price, 0);
		assert.equal(extracted.subscription.commitment.expiresOn, 'never');
	});

	it('should return nested keys in square brackets', async () => {
		const extracted = await extractor.get(data, 'company[name,city]');
		assert.equal(extracted.company.name, 'Webiny LTD');
		assert.equal(extracted.company.city, 'London');
	});

	it('should return whole objects if nested keys aren\'t set', async () => {
		const extracted = await extractor.get(data, `company[name,city,image]`);

		assert.equal(extracted.company.name, 'Webiny LTD');
		assert.equal(extracted.company.city, 'London');
		assert.equal(extracted.company.image.file, 'webiny.jpg');
		assert.equal(extracted.company.image.size.width, 12.5);
		assert.equal(extracted.company.image.size.height, 44);
		assert.equal(extracted.company.image.visible, false);
		assert.hasAllKeys(extracted.company, ['name', 'city', 'image']);
		assert.hasAllKeys(extracted.company.image, ['file', 'size', 'visible']);
		assert.hasAllKeys(extracted.company.image.size, ['width', 'height']);
	});

	it('if a key is an array and no nested keys are set, it should be returned completely', async () => {
		const extracted = await extractor.get(data, `age,objects`);
		assert.equal(extracted.age, 30);
		assert.isArray(extracted.objects);
		assert.lengthOf(extracted.objects, 3);
	});

	it('TODO - if a key is an array and nested keys are set with dot notation, array should be returned - with objects that contain only defined keys', async () => {
		// TODO
		const extracted = await extractor.get(data, `age,objects.type,objects.weight`);
	});

	it('TODO - if a key is an array and nested keys are set inside square brackets notation, array should be returned - with objects that contain only defined keys', async () => {
		// TODO
		const extracted = await extractor.get(data, `age,objects[type,weight]`);
	});

	it('should support listing paths in multiple lines and return complete data with all nested keys', async () => {
		const extracted = await extractor.get(data, `
			 firstName,lastName,enabled,
			 subscription.name,subscription.price,
			 company[name,city,image],
			 age
		`);

		assert.equal(extracted.company.name, 'Webiny LTD');
		assert.equal(extracted.company.city, 'London');
		assert.hasAllKeys(extracted, ['age', 'firstName', 'lastName', 'enabled', 'subscription', 'company']);
		assert.hasAllKeys(extracted.company, ['name', 'city', 'image']);
	});

	it('should correctly receive value that was returned async', async () => {
		const extracted = await extractor.get(data, `promised`);

		assert.hasAllKeys(extracted, ['promised']);
		assert.equal(extracted.promised, 100);
	});

	it('should not include fields that do not exist', async () => {
		const extracted = await extractor.get(data, `
			firstName,middleName,lastName,
			company.name,company.name1,company.image.size.something,
			subscription[basicName,name,commitment[something]],
		`);

		assert.deepEqual(extracted, {
			firstName: 'John',
			lastName: 'Doe',
			company: {
				name: 'Webiny LTD',
				image: {
					size: {},
				}
			},
			subscription: {
				commitment: {},
				name: 'Free'
			}
		});
	});
});