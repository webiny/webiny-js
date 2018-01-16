import {assert} from 'chai';

const {ModelError} = require('webiny-model');
const {Entity, QueryResult} = require('./../../src');
const {User, Company, Image} = require('./../entities/userCompanyImage');
const {One} = require('./../entities/oneTwoThree');
const {ClassA} = require('./../entities/abc');
const sinon = require('sinon');


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

	it('must set entity to null', async () => {
		const entity = new User();
		entity.company = {name: 'Test-1'};

		assert.instanceOf(await entity.company, Company);

		entity.company = null;
		assert.isNull(await entity.company);
	});

	it('should return null because no data was assigned', async () => {
		const entity = new User();
		assert.isNull(await entity.company);
	});

	it('should return entity from storage', async () => {
		const entity = new User();
		entity.getAttribute('company').setStorageValue('A');
		assert.equal(entity.getAttribute('company').value.getCurrent(), 'A');

		sinon.stub(entity.getDriver(), 'findById').callsFake(() => {
			return new QueryResult({id: 'A', name: 'TestCompany'});
		});

		const company = await entity.company;
		entity.getDriver().findById.restore();

		assert.instanceOf(company, Company);
		entity.company.name = 'TestCompany';
	});

	it('should return correct storage value', async () => {
		const entity = new User();

		entity.getAttribute('company').setStorageValue(1);
		assert.equal(await entity.getAttribute('company').getStorageValue(), 1);

		const findById = sinon.stub(entity.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 1, name: 'TestCompany'});
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 'B';
				return new QueryResult();
			});

		entity.company = {id: 5, name: 'Test-1'};
		assert.equal(await entity.getAttribute('company').getStorageValue(), 5);

		entity.company = null;
		assert.equal(await entity.getAttribute('company').getStorageValue(), null);

		findById.restore();
	});

	it('it should auto save linked entity only if it is enabled', async () => {
		const user = new User();

		let save = sinon.stub(user.getDriver(), 'save').callsFake(entity => {
			entity.id = 'A';
			return new QueryResult();
		});

		user.populate({
			firstName: 'John',
			lastName: 'Doe',
			company: {
				name: 'Company',
				image: {
					size: 123.45,
					filename: 'test.jpg'
				}
			}
		});

		user.getAttribute('company').setAutoSave(false);
		user.getAttribute('company').value.getCurrent().getAttribute('image').setAutoSave(false);

		await user.save();

		save.restore();

		assert(save.calledOnce);
		assert.equal(user.id, 'A');

		user.getAttribute('company').setAutoSave();

		// This time we should have an update on User entity, and insert on linked company entity
		save = sinon.stub(user.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'B';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult();
			});

		await user.save();

		save.restore();

		assert(save.calledTwice);
		assert.equal(user.id, 'A');
		assert.equal(await user.get('company.id'), 'B');

		// Finally, let's put auto save on image entity too.

		user.getAttribute('company').value.getCurrent().getAttribute('image').setAutoSave();

		// This time we should have an update on User entity, update on company entity and insert on linked image entity.
		// Additionally, image entity has a createdBy attribute, but since it's empty, nothing must happen here.

		save = sinon.stub(user.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'C';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(() => {
				return new QueryResult();
			});

		try {
			await user.save();
		} catch (e) {
			const bbb = 123;
		}
		save.restore();

		assert(save.calledThrice);
		assert.equal(user.id, 'A');
		assert.equal(await user.get('company.id'), 'B');
		assert.equal(await user.get('company.image.id'), 'C');
	});

	it('auto save must be automatically enabled', async () => {
		const user = new User();
		user.populate({
			firstName: 'John',
			lastName: 'Doe',
			company: {
				name: 'Company',
				image: {
					size: 123.45,
					filename: 'test.jpg'
				}
			}
		});

		let save = sinon.stub(user.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'C';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 'B';
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(entity => {
				entity.id = 'A';
				return new QueryResult();
			});

		await user.save();
		save.restore();

		assert(save.calledThrice);
		assert.equal(user.id, 'A');
		assert.equal(await user.get('company.id'), 'B');
		assert.equal(await user.get('company.image.id'), 'C');
	});

	it('should not trigger saving of same entity (that might be also linked in an another linked entity) twice in one save process', async () => {
		const user = new User();
		user.populate({
			firstName: 'John',
			lastName: 'Doe',
			company: {
				name: 'Company',
				image: {
					size: 123.45,
					filename: 'test.jpg',
					createdBy: user
				}
			}
		});
		await user.save();

		let save = sinon.stub(user.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'C';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 'B';
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(entity => {
				entity.id = 'A';
				return new QueryResult();
			});

		await user.save();
		save.restore();

		assert(save.calledThrice);
		assert.equal(user.id, 'A');

		const company = await user.company;
		assert.equal(company.id, 'B');
		assert.equal((await company.image).id, 'C');
	});

	it('should lazy load any of the accessed linked entities', async () => {
		let findById = sinon.stub(One.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 'one', name: 'One', two: 'two'});
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult({id: 'two', name: 'Two', three: 'three'});
			})
			.onCall(2)
			.callsFake(() => {
				return new QueryResult({id: 'three', name: 'Three', four: 'four', anotherFour: 'anotherFour', five: 'five', six: 'six'});
			})
			.onCall(3)
			.callsFake(() => {
				return new QueryResult({id: 'four', name: 'Four'});
			})
			.onCall(4)
			.callsFake(() => {
				return new QueryResult({id: 'anotherFour', name: 'Another Four'});
			})
			.onCall(5)
			.callsFake(() => {
				return new QueryResult({id: 'five', name: 'Five'});
			})
			.onCall(6)
			.callsFake(() => {
				return new QueryResult({id: 'six', name: 'Six'});
			});

		const one = await One.findById('one');
		assert.equal(one.id, 'one');
		assert.equal(one.name, 'One');
		assert.equal(one.getAttribute('two').value.getCurrent(), 'two');

		const two = await one.two;
		assert.equal(two.id, 'two');
		assert.equal(two.name, 'Two');

		assert.equal(two.getAttribute('three').value.getCurrent(), 'three');

		const three = await two.three;
		assert.equal(three.id, 'three');
		assert.equal(three.name, 'Three');

		assert.equal(three.getAttribute('four').value.getCurrent(), 'four');

		const four = await three.four;
		assert.equal(four.id, 'four');
		assert.equal(four.name, 'Four');

		const anotherFour = await three.anotherFour;
		assert.equal(anotherFour.id, 'anotherFour');
		assert.equal(anotherFour.name, 'Another Four');

		const five = await three.five;
		assert.equal(five.id, 'five');
		assert.equal(five.name, 'Five');

		const six = await three.six;
		assert.equal(six.id, 'six');
		assert.equal(six.name, 'Six');

		findById.restore();
	});

	it('auto delete must be manually enabled and canDelete must stop deletion if error was thrown', async () => {
		const user = new User();
		user.populate({
			firstName: 'John',
			lastName: 'Doe',
			markedAsCannotDelete: true,
			company: {
				name: 'Company',
				markedAsCannotDelete: true,
				image: {
					filename: 'test.jpg',
					size: 123.45,
					markedAsCannotDelete: true
				}
			}
		});

		let entitySave = sinon.stub(user.getDriver(), 'save')
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
		entitySave.restore();

		let error = null;

		let entityDelete = sinon.stub(user.getDriver(), 'delete');
		try {
			await user.delete();
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, Error);
		assert.equal(error.message, 'Cannot delete User entity');
		assert(entityDelete.notCalled);

		user.markedAsCannotDelete = false;
		try {
			await user.delete();
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, Error);
		assert.equal(error.message, 'Cannot delete Company entity');
		assert(entityDelete.notCalled);

		const company = await user.company;
		company.markedAsCannotDelete = false;

		try {
			await user.delete();
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, Error);
		assert.equal(error.message, 'Cannot delete Image entity');
		assert(entityDelete.notCalled);

		const image = await company.image;
		image.markedAsCannotDelete = false;

		await user.delete();

		entityDelete.restore();
		assert(entityDelete.calledThrice);
	});

	it('should properly delete linked entity even though they are not loaded (auto delete enabled)', async () => {
		let findById = sinon.stub(One.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 'one', name: 'One', two: 'two'});
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult({id: 'two', name: 'Two', three: 'three'});
			})
			.onCall(2)
			.callsFake(() => {
				return new QueryResult({id: 'three', name: 'Three', four: 'four', anotherFour: 'anotherFour', five: 'five', six: 'six'});
			})
			.onCall(3)
			.callsFake(() => {
				return new QueryResult({id: 'four', name: 'Four'});
			})
			.onCall(4)
			.callsFake(() => {
				return new QueryResult({id: 'anotherFour', name: 'Another Four'});
			})
			.onCall(5)
			.callsFake(() => {
				return new QueryResult({id: 'five', name: 'Five'});
			})
			.onCall(6)
			.callsFake(() => {
				return new QueryResult({id: 'six', name: 'Six'});
			});

		const one = await One.findById('one');

		let entityDelete = sinon.stub(one.getDriver(), 'delete');
		await one.delete();

		assert.equal(entityDelete.callCount, 7);

		findById.restore();
		entityDelete.restore();
	});

	it('should not trigger save on linked entity since it was not loaded', async () => {
		const findById = sinon.stub(One.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 'one', name: 'One', two: 'two'});
			});

		const one = await One.findById('one');
		findById.restore();

		const save = sinon.stub(one.getDriver(), 'save')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult();
			});

		await one.save();
		save.restore();

		assert(save.calledOnce);
	});

	it('should create new entity and save links correctly', async () => {
		const findById = sinon.stub(One.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 'one', name: 'One'});
			});

		const one = await One.findById('one');
		findById.restore();

		one.two = {name: 'two', three: {name: 'three'}};

		const save = sinon.stub(one.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'three';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 'two';
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(() => {
				return new QueryResult();
			});

		await one.save();
		save.restore();

		assert(save.calledThrice);

		assert.equal(one.id, 'one');

		const two = await one.two;
		assert.equal(two.id, 'two');

		const three = await two.three;
		assert.equal(three.id, 'three');

		assert.equal(await one.getAttribute('two').getStorageValue(), 'two');
		assert.equal(await two.getAttribute('three').getStorageValue(), 'three');
	});

	it('should not delete linked entities if main entity is deleted and auto delete is not enabled', async () => {
		const entityFindById = sinon.stub(ClassA.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 'classA', name: 'ClassA'});
			});

		const classA = await ClassA.findById('classA');
		entityFindById.restore();

		classA.classB = {name: 'classB', classC: {name: 'classC'}};

		const entitySave = sinon.stub(classA.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'classC';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 'classB';
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(() => {
				return new QueryResult();
			});

		await classA.save();
		entitySave.restore();

		assert(entitySave.calledThrice);

		assert.equal(classA.id, 'classA');

		const classB = await classA.classB;
		assert.equal(classB.id, 'classB');

		const classC = await classB.classC;
		assert.equal(classC.id, 'classC');

		assert.equal(await classA.getAttribute('classB').getStorageValue(), 'classB');
		assert.equal(await classB.getAttribute('classC').getStorageValue(), 'classC');

		const entityDelete = sinon.stub(ClassA.getDriver(), 'delete')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult();
			});

		await classA.delete();
		assert(entityDelete.calledOnce);
	});

	it('should delete existing entity once new once was assigned and main entity saved', async () => {
		const findById = sinon.stub(One.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 'A', name: 'Class A'});
			});

		const one = await ClassA.findById('a');
		findById.restore();

		one.two = {name: 'two', three: {name: 'three'}};
	});
});