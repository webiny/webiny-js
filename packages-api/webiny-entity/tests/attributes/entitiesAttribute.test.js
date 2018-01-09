import {assert} from 'chai';
const {Entity, QueryResult} = require('./../../src');
const {ModelError} = require('webiny-model');
const sinon = require('sinon');

describe('attribute entities test', function () {
	class Entity1 extends Entity {
		constructor() {
			super();
			this.attr('name').char().setValidators('required');
			this.attr('number').integer();
			this.attr('type').char().setValidators('in:cat:dog:mouse:parrot');
		}
	}

	class Entity2 extends Entity {
		constructor() {
			super();
			this.attr('firstName').char().setValidators('required');
			this.attr('lastName').char().setValidators('required');
			this.attr('enabled').boolean();
		}
	}

	class MainEntity extends Entity {
		constructor() {
			super();
			this.attr('attribute1').entities(Entity1).setToStorage();
			this.attr('attribute2').entities(Entity2).setToStorage();
		}
	}

	class MainSetOnceEntity extends Entity {
		constructor() {
			super();
			this.attr('attribute1').entities(Entity1).setToStorage().setOnce();
			this.attr('attribute2').entities(Entity2).setToStorage();
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

		mainSetOnceEntity.attribute1 = [];
		mainSetOnceEntity.attribute2 = [];

		const attribute1 = await await mainSetOnceEntity.attribute1; 
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
		mainEntity.attribute2 = [null, 11, {id: 'B', firstName: 'John', lastName: 'Doe'}];

		sinon.stub(entity.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return {id: 10, name: 'Bucky', type: 'dog'};
			})
			.onCall(1)
			.callsFake(() => {
				return {id: 11, firstName: 'Foo', lastName: 'Bar'};
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
		mainEntity.attribute2 = [null, 11, {id: 'X', firstName: 'John', lastName: 'Doe'}, {id: 'Y', firstName: 'Jane', lastName: 'Doe'}];

		sinon.stub(entity.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 10, name: 'Bucky', type: 'dog'});
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult({id: 11, firstName: 'Foo', lastName: 'Bar'});
			});

		const attribute1 = await mainEntity.attribute1;
		assert.lengthOf(attribute1, 5);
		assert.isNull(attribute1[0]);
		assert.instanceOf(attribute1[1], Entity1);
		assert.instanceOf(attribute1[2], Entity1);
		assert.instanceOf(attribute1[3], Entity1);
		assert.instanceOf(attribute1[4], Entity1);

		const attribute2 = await mainEntity.attribute2;
		assert.lengthOf(await attribute2, 4);
		assert.isNull(attribute2[0]);
		assert.instanceOf(attribute2[1], Entity2);
		assert.instanceOf(attribute2[2], Entity2);
		assert.instanceOf(attribute2[3], Entity2);

		const attribute1Value = await mainEntity.getAttribute('attribute1').getStorageValue();
		assert.lengthOf(attribute1Value, 5);
		assert.equal(attribute1Value[0], null);
		assert.equal(attribute1Value[1], 10);
		assert.equal(attribute1Value[2], 'A');
		assert.equal(attribute1Value[3], 'B');
		assert.equal(attribute1Value[4], 'C');

		const attribute2Value = await mainEntity.getAttribute('attribute2').getStorageValue();
		assert.lengthOf(attribute2Value, 4);
		assert.equal(attribute2Value[0], null);
		assert.equal(attribute2Value[1], 11);
		assert.equal(attribute2Value[2], 'X');
		assert.equal(attribute2Value[3], 'Y');

		entity.getDriver().findById.restore();

		mainEntity.attribute1 = null;
		const attribute1NullValue = await mainEntity.getAttribute('attribute1').getStorageValue();
		assert.isEmpty(attribute1NullValue);
		assert.isNull(await mainEntity.attribute1);
	});

	it('should correctly set storage value', async () => {
		const mainEntity = new MainEntity();

		mainEntity.populateFromStorage({
			attribute1: ['A', 'B'],
			attribute2: ['C']
		});

		assert.equal(mainEntity.getAttribute('attribute1').value.current[0], 'A');
		assert.equal(mainEntity.getAttribute('attribute1').value.current[1], 'B');
		assert.equal(mainEntity.getAttribute('attribute2').value.current[0], 'C');

		sinon.stub(entity.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 'A', name: 'Bucky', type: 'dog'});
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult({id: 'B', name: 'Enlai', type: 'dog'});
			})
			.onCall(2)
			.callsFake(() => {
				return new QueryResult({id: 'C', firstName: 'Foo', lastName: 'Bar'});
			});

		const attribute1 = await mainEntity.attribute1;
		const attribute2 = await mainEntity.attribute2;

		entity.getDriver().findById.restore();

		assert.lengthOf(attribute1, 2);
		assert.equal(attribute1[0].id, 'A');
		assert.equal(attribute1[1].id, 'B');

		assert.equal(attribute2[0].id, 'C');

	});
});