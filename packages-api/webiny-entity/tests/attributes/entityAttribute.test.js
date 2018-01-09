import {assert} from 'chai';
const {ModelError} = require('webiny-model');
const {Entity, QueryResult} = require('./../../src');
const sinon = require('sinon');

class Image extends Entity {
	constructor() {
		super();
		this.attr('filename').char().setValidators('required');
		this.attr('size').float();
	}
}

Image.classId = 'Image';

class Company extends Entity {
	constructor() {
		super();
		this.attr('name').char().setValidators('required');
		this.attr('image').entity(Image);
	}
}

Company.classId = 'Company';

class User extends Entity {
	constructor() {
		super();
		this.attr('firstName').char().setValidators('required');
		this.attr('lastName').char().setValidators('required');
		this.attr('company').entity(Company)
	}
}

User.classId = 'User';

describe('entity attribute test', function () {
	it('should fail because an invalid instance was set', async () => {
		const user = new User();

		user.firstName = 'John';
		user.lastName = 'Doe';
		user.company = {
			name: 'Company',
			image: new Company()
		};

		let error = null;
		try {
			await user.validate();
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, ModelError);
		assert.equal(error.getData().invalidAttributes.company.data.invalidAttributes.image.type, ModelError.INVALID_ATTRIBUTE)
	});

	it('should set root and nested values correctly', async () => {
		const user = new User();

		user.firstName = 'John';
		user.lastName = 'Doe';
		user.company = {
			name: 'Company',
			image: {
				filename: 'image.jpg',
				size: 123.45,
			}
		};

		const company = await user.company;
		const image = await company.image;

		assert.equal(user.firstName, 'John');
		assert.equal(user.lastName, 'Doe');
		assert.instanceOf(company, Company);
		assert.instanceOf(await company.image, Image);
		assert.equal(company.name, 'Company');
		assert.equal(image.filename, 'image.jpg');
		assert.equal(image.size, 123.45);

		image.filename = 'image222.jpg';
		image.size = 234.56;

		assert.equal(image.filename, 'image222.jpg');
		assert.equal(image.size, 234.56);
	});

	it('should populate values correctly', async () => {
		const user = new User();
		user.populate({
			firstName: 'John',
			lastName: 'Doe',
			company: {
				name: 'Company',
				image: {
					filename: 'image.jpg',
					size: 123.45,
				}
			}
		});

		const company = await user.company;
		const image = await company.image;

		assert.equal(user.firstName, 'John');
		assert.equal(user.lastName, 'Doe');
		assert.instanceOf(company, Company);
		assert.instanceOf(image, Image);
		assert.equal(company.name, 'Company');
		assert.equal(image.filename, 'image.jpg');
		assert.equal(image.size, 123.45);
	});

	it('should validate root and nested values ', async () => {
		const user = new User();
		user.populate({
			firstName: 'John',
			lastName: 'Doe',
			company: {
				image: {
					size: 123.45
				}
			}
		});

		let error = null;
		try {
			await user.validate();
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, ModelError);
		assert.equal(error.getType(), ModelError.INVALID_ATTRIBUTES);
		let invalid = error.getData().invalidAttributes.company.data.invalidAttributes;

		assert.hasAllKeys(invalid, ['name', 'image']);
		assert.equal(invalid.name.data.validator, 'required');

		assert.hasAllKeys(invalid.image.data.invalidAttributes, ['filename']);
		assert.equal(invalid.image.data.invalidAttributes.filename.data.validator, 'required');

		user.populate({
			company: {
				image: {
					filename: 'image.jpg'
				}
			}
		});

		error = null;
		try {
			await user.validate();
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, ModelError);
		assert.equal(error.getType(), ModelError.INVALID_ATTRIBUTES);
		invalid = error.getData().invalidAttributes.company.data.invalidAttributes;

		assert.hasAllKeys(invalid, ['name']);
		assert.equal(invalid.name.data.validator, 'required');

		user.populate({
			company: {
				name: 'Company'
			}
		});

		error = null;
		try {
			await user.validate();
		} catch (e) {
			error = e;
		}

		assert.isNull(error);
	});

	it('should set entity only once using setter and populate methods', async () => {
		class Primary extends Entity {
			constructor() {
				super();
				this.attr('name').char().setValidators('required');
				this.attr('secondary').entity(Secondary).setOnce();
			}
		}

		class Secondary extends Entity {
			constructor() {
				super();
				this.attr('name').char().setValidators('required');
			}
		}

		const secondary1 = new Secondary();
		secondary1.name = 'secondary1';

		const primary = new Primary();
		primary.name = 'primary';
		primary.secondary = secondary1;

		assert.equal(primary.name, 'primary');

		let secondary = await primary.secondary;
		assert.equal(secondary.name, 'secondary1');

		const secondary2 = new Secondary();
		secondary2.name = 'secondary2';

		primary.secondary = secondary2;

		secondary = await primary.secondary;
		assert.equal(primary.name, 'primary');
		assert.equal(secondary.name, 'secondary1');

	});

	it('should set entity only once using setter and populate methods', async () => {
		class Primary extends Entity {
			constructor() {
				super();
				this.attr('name').char().setValidators('required');
				this.attr('secondary').entity(Secondary).setOnce();
			}
		}

		class Secondary extends Entity {
			constructor() {
				super();
				this.attr('name').char().setValidators('required');
			}
		}

		const secondary1 = new Secondary();
		secondary1.name = 'secondary1';

		const primary = new Primary();
		primary.name = 'primary';
		primary.secondary = secondary1;

		let secondary = await primary.secondary;

		assert.equal(primary.name, 'primary');
		assert.equal(secondary.name, 'secondary1');

		const secondary2 = new Secondary();
		secondary2.name = 'secondary2';

		primary.secondary = secondary2;

		secondary = await primary.secondary;
		assert.equal(primary.name, 'primary');
		assert.equal(secondary.name, 'secondary1');

	});

	it('it must set entity to null', async () => {
		const entity = new User();
		entity.company = {name: 'Test-1'};

		assert.instanceOf(await entity.company, Company);

		entity.company = null;
		assert.isNull(await entity.company);
	});

	it('it should return null because no data was assigned', async () => {
		const entity = new User();
		assert.isNull(await entity.company);
	});

	it('it should return entity from storage', async () => {
		const entity = new User();
		entity.getAttribute('company').setStorageValue(1);

		sinon.stub(entity.getDriver(), 'findById').callsFake(() => {
			return new QueryResult({name: 'TestCompany'});
		});

		const company = await entity.company;
		entity.getDriver().findById.restore();

		assert.instanceOf(company, Company);
		entity.company.name = 'TestCompany';
	});

	it('it should return correct storage value', async () => {
		const entity = new User();

		entity.getAttribute('company').setStorageValue(1);
		assert.equal(await entity.getAttribute('company').getStorageValue(), 1);

		entity.company = {id: 5, name: 'Test-1'};
		assert.equal(await entity.getAttribute('company').getStorageValue(), 5);

		entity.company = null;
		assert.equal(await entity.getAttribute('company').getStorageValue(), null);

	});

});