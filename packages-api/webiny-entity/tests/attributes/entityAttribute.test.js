import {assert} from 'chai';

const {ModelError} = require('webiny-model');
const {Entity, QueryResult} = require('./../../src');
const sinon = require('sinon');

class Image extends Entity {
	constructor() {
		super();
		this.attr('filename').char().setValidators('required');
		this.attr('size').float();
		this.attr('createdBy').entity(User);
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

	it('it should auto save linked entity only if it is enabled', async () => {
		const user = new User();

		let save = sinon.stub(user.getDriver(), 'save').callsFake(entity => {
			entity.id = 55;
			return new QueryResult();
		});

		user.populate({
			firstName: 'John',
			lastName: 'Doe',
			company: {
				image: {
					size: 123.45
				}
			}
		});

		user.getAttribute('company').setAutoSave(false);
		user.getAttribute('company').value.current.getAttribute('image').setAutoSave(false);

		await user.save();
		save.restore();

		assert(save.calledOnce);
		assert.equal(user.id, 55);

		user.getAttribute('company').setAutoSave();

		// This time we should have an update on User entity, and insert on linked company entity
		save = sinon.stub(user.getDriver(), 'save')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 66;
				return new QueryResult();
			});

		await user.save();
		save.restore();

		assert(save.calledTwice);
		assert.equal(user.id, 55);
		assert.equal(await user.get('company.id'), 66);

		// Finally, let's put auto save on image entity too.

		user.getAttribute('company').value.current.getAttribute('image').setAutoSave();

		// This time we should have an update on User entity, update on company entity and insert on linked image entity.
		// Additionally, image entity has a createdBy attribute, but since it's empty, nothing must happen here.

		save = sinon.stub(user.getDriver(), 'save')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(entity => {
				entity.id = 77;
				return new QueryResult();
			});

		await user.save();
		save.restore();

		assert(save.calledThrice);
		assert.equal(user.id, 55);
		assert.equal(await user.get('company.id'), 66);
		assert.equal(await user.get('company.image.id'), 77);
	});

	it('auto save must be automatically enabled', async () => {
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

		let save = sinon.stub(user.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 55;
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 66;
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(entity => {
				entity.id = 77;
				return new QueryResult();
			});

		await user.save();
		save.restore();

		assert(save.calledThrice);
		assert.equal(user.id, 55);
		assert.equal(await user.get('company.id'), 66);
		assert.equal(await user.get('company.image.id'), 77);
	});

	it('should not trigger saving of same entity (that might be also linked in an another linked entity) twice in one save process', async () => {
		const user = new User();
		user.populate({
			firstName: 'John',
			lastName: 'Doe',
			company: {
				image: {
					size: 123.45,
					createdBy: user
				}
			}
		});
		await user.save();

		let save = sinon.stub(user.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 55;
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 66;
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(entity => {
				entity.id = 77;
				return new QueryResult();
			});

		await user.save();
		save.restore();

		assert(save.calledThrice);
		assert.equal(user.id, 55);

		const company = await user.company;
		assert.equal(company.id, 66);
		assert.equal((await company.image).id, 77);
	});


});