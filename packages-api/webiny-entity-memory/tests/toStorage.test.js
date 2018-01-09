import {assert} from 'chai';
const {ComplexEntity, SimpleEntity} = require('./entities/complexEntity');

describe('toStorage test', function () {
	it('should correctly adapt the data for Memory', async () => {
		const complexEntity = new ComplexEntity();
		complexEntity.populate({
			firstName: 'test',
			lastName: 'tester',
			verification: {
				verified: true,
				documentType: 'driversLicense'
			},
			tags: [
				{slug: 'no-name', label: 'No Name'},
				{slug: 'adult-user', label: 'Adult User'}
			]
		});

		const simpleEntity1 = new SimpleEntity();
		simpleEntity1.id = 'A';
		simpleEntity1.name = 'Test-1';

		complexEntity.simpleEntity = simpleEntity1;

		const simpleEntity2 = new SimpleEntity();
		simpleEntity2.id = 'B';
		simpleEntity2.name = 'Test-2';

		const simpleEntity3 = new SimpleEntity();
		simpleEntity3.id = 'C';
		simpleEntity3.name = 'Test-3';

		const simpleEntity4 = new SimpleEntity();
		simpleEntity4.id = 'D';
		simpleEntity4.name = 'Test-4';

		complexEntity.simpleEntities = [simpleEntity2, simpleEntity3, simpleEntity4];

		const userStorageValue = await complexEntity.toStorage();

		assert.equal(userStorageValue.firstName, 'test');
		assert.equal(userStorageValue.lastName, 'tester');
		assert.deepEqual(userStorageValue.verification, {"verified": true, "documentType": "driversLicense"});
		assert.deepEqual(userStorageValue.tags, [{"slug": "no-name", "label": "No Name"}, {"slug": "adult-user", "label": "Adult User"}]);
		assert.equal(userStorageValue.simpleEntity, 'A');
		assert.deepEqual(userStorageValue.simpleEntities, ['B', 'C', 'D']);
	});
});

