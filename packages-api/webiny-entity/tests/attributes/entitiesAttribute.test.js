import {assert} from 'chai';

const {Entity, QueryResult, EntityCollection} = require('./../../src');
const {ModelError} = require('webiny-model');
const sinon = require('sinon');

describe('attribute entities test', function () {
	class Entity1 extends Entity {
		constructor() {
			super();
			this.attr('name').char().setValidators('required');
			this.attr('number').integer();
			this.attr('type').char().setValidators('in:cat:dog:mouse:parrot');
			this.attr('markedAsCannotDelete').boolean();
		}

		canDelete() {
			if (this.markedAsCannotDelete) {
				throw Error('Cannot delete Entity1 entity');
			}
		}
	}

	class Entity2 extends Entity {
		constructor() {
			super();
			this.attr('firstName').char().setValidators('required');
			this.attr('lastName').char().setValidators('required');
			this.attr('enabled').boolean();
			this.attr('markedAsCannotDelete').boolean();
		}

		canDelete() {
			if (this.markedAsCannotDelete) {
				throw Error('Cannot delete Entity2 entity');
			}
		}
	}

	class MainEntity extends Entity {
		constructor() {
			super();
			this.attr('attribute1').entities(Entity1);
			this.attr('attribute2').entities(Entity2);
		}
	}

	class MainSetOnceEntity extends Entity {
		constructor() {
			super();
			this.attr('attribute1').entities(Entity1).setOnce();
			this.attr('attribute2').entities(Entity2);
		}
	}

	const entity = new MainEntity();

	it('should fail - attributes should accept array of entities', async () => {
		entity.attribute1 = new Entity1();
		assert.instanceOf(await entity.attribute1, Entity1);

		entity.attribute2 = new Entity1();
		assert.instanceOf(await entity.attribute2, Entity1);

		try {
			await entity.validate();
		} catch (e) {
			assert.equal(e.data.invalidAttributes.attribute1.type, ModelError.INVALID_ATTRIBUTE);
			assert.equal(e.data.invalidAttributes.attribute2.type, ModelError.INVALID_ATTRIBUTE);
			return;
		}

		throw Error('Error should\'ve been thrown.')
	});

	it('should pass - empty arrays set', async () => {
		entity.attribute1 = [];
		entity.attribute2 = [];
		await entity.validate();
	});

	it('should fail - arrays with empty plain objects set - nested validation must be triggered', async () => {
		entity.attribute1 = [{}, {}];
		entity.attribute2 = [{}, {}, {}];
		try {
			await entity.validate();
		} catch (e) {
			const attr1 = e.data.invalidAttributes.attribute1;
			assert.lengthOf(attr1.data.items, 2);
			assert.equal(attr1.data.items[0].data.index, 0);
			assert.equal(attr1.data.items[0].data.invalidAttributes.name.type, ModelError.INVALID_ATTRIBUTE);
			assert.equal(attr1.data.items[0].data.invalidAttributes.name.data.validator, 'required');
			assert.notExists(attr1.data.items[0].data.invalidAttributes.type);

			const attr2 = e.data.invalidAttributes.attribute2;
			assert.lengthOf(attr2.data.items, 3);
			assert.equal(attr2.data.items[0].data.index, 0);
			assert.equal(attr2.data.items[1].data.index, 1);
			assert.equal(attr2.data.items[2].data.index, 2);

			assert.equal(attr2.data.items[0].data.invalidAttributes.firstName.type, ModelError.INVALID_ATTRIBUTE);
			assert.equal(attr2.data.items[0].data.invalidAttributes.lastName.type, ModelError.INVALID_ATTRIBUTE);
			assert.notExists(attr2.data.items[0].data.invalidAttributes.enabled);

			return;
		}
		throw Error('Error should\'ve been thrown.');

	});

	it('should pass - valid data sent', async () => {
		entity.attribute1 = [{name: 'Enlai', type: 'dog'}, {name: 'Rocky', type: 'dog'}, {name: 'Lina', type: 'parrot'}];
		entity.attribute2 = [{firstName: 'John', lastName: 'Doe'}, {firstName: 'Jane', lastName: 'Doe'}];
		await entity.validate();
	});

	it('should fail - all good except last item of attribute1', async () => {
		entity.attribute1 = [{name: 'Enlai', type: 'dog'}, {name: 'Rocky', type: 'dog'}, {name: 'Lina', type: 'bird'}];
		entity.attribute2 = [{firstName: 'John', lastName: 'Doe'}, {firstName: 'Jane', lastName: 'Doe'}];

		try {
			await entity.validate();
		} catch (e) {
			const attr1 = e.data.invalidAttributes.attribute1;
			assert.lengthOf(attr1.data.items, 1);
			assert.equal(attr1.data.items[0].data.index, 2);
			assert.equal(attr1.data.items[0].data.invalidAttributes.type.type, ModelError.INVALID_ATTRIBUTE);
			assert.equal(attr1.data.items[0].data.invalidAttributes.type.data.validator, 'in');
		}
	});

	it('should not change attribute1 since it has setOnce applied - attribute2 should be emptied', async () => {
		const mainSetOnceEntity = new MainSetOnceEntity();
		mainSetOnceEntity.attribute1 = [{name: 'Enlai', type: 'dog'}, {name: 'Rocky', type: 'dog'}, {name: 'Lina', type: 'bird'}];
		mainSetOnceEntity.attribute2 = [{firstName: 'John', lastName: 'Doe'}, {firstName: 'Jane', lastName: 'Doe'}];

		let attribute1 = await mainSetOnceEntity.attribute1;
		assert.equal(attribute1[0].name, 'Enlai');
		assert.equal(attribute1[1].name, 'Rocky');
		assert.equal(attribute1[2].name, 'Lina');

		mainSetOnceEntity.attribute1 = [];
		mainSetOnceEntity.attribute2 = [];

		attribute1 = await mainSetOnceEntity.attribute1;
		assert.notEmpty(attribute1);
		assert.equal(attribute1[0].name, 'Enlai');
		assert.equal(attribute1[1].name, 'Rocky');
		assert.equal(attribute1[2].name, 'Lina');
		assert.isUndefined(attribute1[3]);

		assert.isEmpty(await mainSetOnceEntity.attribute2);
	});

	it('should correctly validate instances in the attribute', async () => {
		const mainEntity = new MainEntity();
		mainEntity.attribute1 = [null, 10, {id: 'A', name: 'Enlai', type: 'dog'}, new Entity2().populate({
			firstName: 'Foo',
			lastName: 'bar'
		})];
		mainEntity.attribute2 = [null, 'AA', {id: 'B', firstName: 'John', lastName: 'Doe'}];

		sinon.stub(entity.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return {id: 10, name: 'Bucky', type: 'dog'};
			})
			.onCall(1)
			.callsFake(() => {
				return {id: 'AA', firstName: 'Foo', lastName: 'Bar'};
			});

		let error = null;
		try {
			await mainEntity.getAttribute('attribute1').validate();
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, ModelError);

		await mainEntity.getAttribute('attribute2').validate();

		entity.getDriver().findById.restore();

		mainEntity.attribute1 = null;
		await mainEntity.getAttribute('attribute1').validate();
	});

	it('should return correct storage values', async () => {
		const mainEntity = new MainEntity();
		mainEntity.attribute1 = [null, 10, {id: 'A', name: 'Enlai', type: 'dog'}, {id: 'B', name: 'Rocky', type: 'dog'}, {
			id: 'C',
			name: 'Lina',
			type: 'bird'
		}];
		mainEntity.attribute2 = [null, 'AA', {id: 'X', firstName: 'John', lastName: 'Doe'}, {id: 'Y', firstName: 'Jane', lastName: 'Doe'}];

		sinon.stub(entity.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 10, name: 'Bucky', type: 'dog'});
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult({id: 'AA', firstName: 'Foo', lastName: 'Bar'});
			});

		const attribute1 = await mainEntity.attribute1;
		assert.lengthOf(attribute1, 5);
		assert.isNull(attribute1[0]);
		assert.equal(attribute1[1], 10);
		assert.instanceOf(attribute1[2], Entity1);
		assert.instanceOf(attribute1[3], Entity1);
		assert.instanceOf(attribute1[4], Entity1);

		const attribute2 = await mainEntity.attribute2;
		assert.lengthOf(await attribute2, 4);
		assert.isNull(attribute2[0]);
		assert.equal(attribute2[1], 'AA');
		assert.instanceOf(attribute2[2], Entity2);
		assert.instanceOf(attribute2[3], Entity2);

		const attribute1Value = await mainEntity.getAttribute('attribute1').getStorageValue();
		assert.lengthOf(attribute1Value, 3);
		assert.equal(attribute1Value[0], 'A');
		assert.equal(attribute1Value[1], 'B');
		assert.equal(attribute1Value[2], 'C');

		const attribute2Value = await mainEntity.getAttribute('attribute2').getStorageValue();
		assert.lengthOf(attribute2Value, 3);
		assert.equal(attribute2Value[0], 'AA');
		assert.equal(attribute2Value[1], 'X');
		assert.equal(attribute2Value[2], 'Y');

		entity.getDriver().findById.restore();

		mainEntity.attribute1 = null;
		const attribute1NullValue = await mainEntity.getAttribute('attribute1').getStorageValue();
		assert.isEmpty(attribute1NullValue);
		assert.isNull(await mainEntity.attribute1);
	});

	it('should not set anything as values since setToStorage is not enabled by default', async () => {
		const mainEntity = new MainEntity();

		mainEntity.populateFromStorage({
			attribute1: ['A', 'B'],
			attribute2: ['C']
		});

		assert.isArray(mainEntity.getAttribute('attribute1').value.current);
		assert.isArray(mainEntity.getAttribute('attribute2').value.current);
	});

	it('should lazy load any of the accessed linked entities', async () => {
		const entityFind = sinon.stub(MainEntity.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 10});
			});

		const mainEntity = await MainEntity.findById(123);
		entityFind.restore();

		const entitiesFind = sinon.stub(entity.getDriver(), 'find')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult([{id: 'AA', name: 'Bucky', type: 'dog'}, {id: 12, name: 'Rocky', type: 'dog'}]);
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult([{id: 13, firstName: 'Foo', lastName: 'Bar'}]);
			});

		assert.isArray(mainEntity.getAttribute('attribute1').value.current);
		assert.lengthOf(mainEntity.getAttribute('attribute1').value.current, 0);
		assert.isArray(mainEntity.getAttribute('attribute2').value.current);
		assert.lengthOf(mainEntity.getAttribute('attribute2').value.current, 0);

		const attribute1 = await mainEntity.attribute1;
		assert.instanceOf(attribute1, EntityCollection);
		assert.lengthOf(attribute1, 2);
		assert.equal(attribute1[0].id, 'AA');
		assert.equal(attribute1[1].id, 12);
		assert.instanceOf(attribute1[0], Entity1);
		assert.instanceOf(attribute1[1], Entity1);

		const attribute2 = await mainEntity.attribute2;
		assert.instanceOf(attribute2, EntityCollection);
		assert.lengthOf(attribute2, 1);
		assert.equal(attribute2[0].id, 13);
		assert.instanceOf(attribute2[0], Entity2);

		entitiesFind.restore();
	});

	/*it('auto delete must be automatically enabled and canDelete must stop deletion if error was thrown', async () => {
		const mainEntity = new MainEntity();
		mainEntity.attribute1 = [
			{id: 'A', name: 'Enlai', type: 'dog', markedAsCannotDelete: true},
			new Entity1().populate({id: 'AA', name: 'Bucky', type: 'dog'})
		];

		mainEntity.attribute2 = [{id: 'B', firstName: 'John', lastName: 'Doe', markedAsCannotDelete: true}];

		let entitySave = sinon.stub(mainEntity.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'AA';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 'BB';
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(entity => {
				entity.id = 'CC';
				return new QueryResult();
			})
			.onCall(3)
			.callsFake(entity => {
				entity.id = 'DD';
				return new QueryResult();
			});

		await mainEntity.save();
		entitySave.restore();

		let error = null;

		let entityDelete = sinon.stub(mainEntity.getDriver(), 'delete');
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

	it('should properly delete linked entity even though they are not loaded', async () => {
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
	});*/

	it('should not trigger save on linked entity since it was not loaded', async () => {
	});

	it('should add an entity to the list of entities', async () => {
	});

	it('should delete entities that are not part of the array anymore', async () => {
	});

});