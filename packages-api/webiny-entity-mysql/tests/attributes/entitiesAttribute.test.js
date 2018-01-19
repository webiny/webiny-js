import {assert} from 'chai';

const {EntityCollection} = require('webiny-entity');

const {ComplexEntity, SimpleEntity} = require('./../entities/complexEntity');
import sinon from 'sinon';

describe('entity attribute test', function () {
	it('it must populate the attribute correctly', async () => {
		const entity = new ComplexEntity();
		assert.deepEqual(entity.getAttribute('simpleEntitiesLoadedFromTable').value.status, {loading: false, loaded: false});

		entity.simpleEntitiesLoadedFromTable = [{name: 'Test-1'}, {name: 'Test-2'}, {name: 'Test-3'}];
		assert.deepEqual(entity.getAttribute('simpleEntitiesLoadedFromTable').value.status, {loading: true, loaded: false});

		let simpleEntities = await entity.simpleEntitiesLoadedFromTable;
		assert.deepEqual(entity.getAttribute('simpleEntitiesLoadedFromTable').value.status, {loading: false, loaded: true});

		assert.lengthOf(simpleEntities, 3);
		assert.instanceOf(simpleEntities[0], SimpleEntity);
		assert.instanceOf(simpleEntities[1], SimpleEntity);
		assert.instanceOf(simpleEntities[2], SimpleEntity);
		assert.isNull(simpleEntities[0].id);
		assert.isNull(simpleEntities[1].id);
		assert.isNull(simpleEntities[2].id);
		assert.equal(simpleEntities[0].name, 'Test-1');
		assert.equal(simpleEntities[1].name, 'Test-2');
		assert.equal(simpleEntities[2].name, 'Test-3');

		const simpleEntity1 = new SimpleEntity();
		simpleEntity1.name = 'Test-1';

		const simpleEntity2 = new SimpleEntity();
		simpleEntity2.name = 'Test-2';

		const simpleEntity3 = new SimpleEntity();
		simpleEntity3.name = 'Test-3';

		entity.simpleEntitiesLoadedFromTable = [simpleEntity1, simpleEntity2, simpleEntity3];
		assert.deepEqual(entity.getAttribute('simpleEntitiesLoadedFromTable').value.status, {loading: false, loaded: true});

		simpleEntities = await entity.simpleEntitiesLoadedFromTable;
		assert.deepEqual(entity.getAttribute('simpleEntitiesLoadedFromTable').value.status, {loading: false, loaded: true});

		assert.lengthOf(simpleEntities, 3);
		assert.instanceOf(simpleEntities[0], SimpleEntity);
		assert.instanceOf(simpleEntities[1], SimpleEntity);
		assert.instanceOf(simpleEntities[2], SimpleEntity);
		assert.isNull(simpleEntities[0].id);
		assert.isNull(simpleEntities[1].id);
		assert.isNull(simpleEntities[2].id);
		assert.equal(simpleEntities[0].name, 'Test-1');
		assert.equal(simpleEntities[1].name, 'Test-2');
		assert.equal(simpleEntities[2].name, 'Test-3');

		assert.deepEqual(entity.getAttribute('simpleEntitiesLoadedFromTable').value.status, {loading: false, loaded: true});
		entity.simpleEntitiesLoadedFromTable = null;

		assert.isNull(await entity.simpleEntitiesLoadedFromTable);
		assert.deepEqual(entity.getAttribute('simpleEntitiesLoadedFromTable').value.status, {loading: false, loaded: true});

	});

	it('it null is set, it should accept it', async () => {
		const entity = new ComplexEntity();

		entity.simpleEntitiesLoadedFromTable = [{name: 'Test-1'}, {name: 'Test-2'}, {name: 'Test-3'}];
		entity.simpleEntitiesLoadedFromTable = null;
		assert.deepEqual(entity.getAttribute('simpleEntitiesLoadedFromTable').value.status, {loading: true, loaded: false});
		assert.lengthOf(entity.getAttribute('simpleEntitiesLoadedFromTable').value.queue, 1);

		assert.isNull(await entity.simpleEntitiesLoadedFromTable);
		assert.deepEqual(entity.getAttribute('simpleEntitiesLoadedFromTable').value.status, {loading: false, loaded: true});
	});

	it('it should return correct toStorage data', async () => {
		let entity = new ComplexEntity();
		entity.simpleEntitiesLoadedFromTable = [{id: 1, name: 'Test-1'}, {id: 2, name: 'Test-2'}, {id: 3, name: 'Test-3'}];

		let actual = await entity.toStorage();
		let expected = {
			id: null,
			firstName: null,
			lastName: null,
			verification: null,
			tags: null,
			simpleEntity: null,
			simpleEntities: null
		};
		assert.deepEqual(actual, expected);

		entity = new ComplexEntity();
		actual = await entity.toStorage();
		expected = {
			id: null,
			firstName: null,
			lastName: null,
			verification: null,
			tags: null,
			simpleEntity: null,
			simpleEntities: null
		};
		assert.deepEqual(actual, expected);
	});

	it('should return EntityCollection which is the default value of the attribute', async () => {
		const entity = new ComplexEntity();
		assert.instanceOf(await entity.simpleEntitiesLoadedFromTable, EntityCollection);
	});

	it('should load entities from another table - only when the attribute is actually accessed', async () => {
		sinon.stub(ComplexEntity.getDriver().getConnection(), 'query')
			.onCall(0)
			.callsFake((query, callback) => {
				callback(null, [{
					"id": 1,
					"name": "This is a test",
					"slug": "thisIsATest",
					"enabled": 1
				}]);
			})
			.onCall(1)
			.callsFake((query, callback) => {
				callback(null, [
					{
						"id": 2,
						"name": "This is a test B",
						"slug": "thisIsATestB",
						"enabled": 1
					},
					{
						"id": 3,
						"name": "This is a test C",
						"slug": "thisIsATestC",
						"enabled": 1
					},
					{
						"id": 4,
						"name": "This is a test D",
						"slug": "thisIsATestD",
						"enabled": 1
					}
				]);
			})
			.onCall(2)
			.callsFake((query, callback) => {
				callback(null, [{count: 3}]);
			});

		const entity = await ComplexEntity.findOne();
		assert.equal(entity.id, 1);

		assert.deepEqual(entity.getAttribute('simpleEntitiesLoadedFromTable').value.status, {loading: false, loaded: false});
		assert.instanceOf(entity.getAttribute('simpleEntitiesLoadedFromTable').value.getCurrent(), EntityCollection);
		assert.deepEqual(entity.getAttribute('simpleEntitiesLoadedFromTable').value.status, {loading: false, loaded: false});

		// After getting the attribute, let's check if everything was loaded correctly.
		const simpleEntities = await entity.simpleEntitiesLoadedFromTable;
		assert.deepEqual(entity.getAttribute('simpleEntitiesLoadedFromTable').value.status, {loading: false, loaded: true});

		assert.lengthOf(simpleEntities, 3);
		assert.instanceOf(simpleEntities[0], SimpleEntity);
		assert.instanceOf(simpleEntities[1], SimpleEntity);
		assert.instanceOf(simpleEntities[2], SimpleEntity);
		assert.equal(simpleEntities[0].id, 2);
		assert.equal(simpleEntities[1].id, 3);
		assert.equal(simpleEntities[2].id, 4);
		assert.equal(simpleEntities[0].name, 'This is a test B');
		assert.equal(simpleEntities[1].name, 'This is a test C');
		assert.equal(simpleEntities[2].name, 'This is a test D');

		SimpleEntity.getDriver().getConnection().query.restore();
	});

	it('when saving main entity, it should save linked entities only if auto save is enabled', async () => {
		const entity = new ComplexEntity();
		entity.populate({
			name: "This is a test",
			slug: "thisIsATest",
			enabled: 1,
			simpleEntitiesLoadedFromTable: [{name: 'Test-1'}, {name: 'Test-2'}, {name: 'Test-3'}]
		});

		sinon.stub(entity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
			callback(null, {insertId: 1});
		});

		await entity.save();

		entity.getDriver().getConnection().query.restore();

		assert.equal(entity.id, 1);
		assert.isTrue(entity.getAttribute('id').value.isClean());

		let simpleEntities = await entity.simpleEntitiesLoadedFromTable;
		assert.instanceOf(simpleEntities[0], SimpleEntity);
		assert.instanceOf(simpleEntities[1], SimpleEntity);
		assert.instanceOf(simpleEntities[2], SimpleEntity);

		assert.isNull(simpleEntities[0].id);
		assert.isNull(simpleEntities[1].id);
		assert.isNull(simpleEntities[2].id);

		assert.isTrue(entity.getAttribute('simpleEntitiesLoadedFromTable').value.isDirty());

		// Now let's try to save entity with auto save enabled on "simpleEntitiesLoadedFromTable" attribute.
		entity.getAttribute('simpleEntitiesLoadedFromTable').setAutoSave();

		sinon.stub(ComplexEntity.getDriver().getConnection(), 'query')
			.onCall(0)
			.callsFake((query, callback) => {
				callback(null, {entityId: 'does not matter'});
			})
			.onCall(1)
			.callsFake((query, callback) => {
				callback(null, {insertId: 2});

			})
			.onCall(2)
			.callsFake((query, callback) => {
				callback(null, {insertId: 3});

			})
			.onCall(3)
			.callsFake((query, callback) => {
				callback(null, {insertId: 4});

			});

		await entity.save();

		entity.getDriver().getConnection().query.restore();

		assert.equal(entity.id, 1);
		assert.isTrue(entity.getAttribute('id').value.isClean());
		assert.isTrue(entity.getAttribute('simpleEntitiesLoadedFromTable').value.isClean());

		simpleEntities = await entity.simpleEntitiesLoadedFromTable;

		assert.instanceOf(simpleEntities[0], SimpleEntity);
		assert.instanceOf(simpleEntities[1], SimpleEntity);
		assert.instanceOf(simpleEntities[2], SimpleEntity);

		assert.equal(simpleEntities[0].id, 2);
		assert.equal(simpleEntities[1].id, 3);
		assert.equal(simpleEntities[2].id, 4);
	});
});