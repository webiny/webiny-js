import {assert} from 'chai';
import {ComplexEntity, SimpleEntity} from './entities/complexEntity'

describe('toStorage test', function () {
	it('should correctly adapt the data for MySQL', async () => {
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
		simpleEntity1.id = 1;
		simpleEntity1.name = 'Test-1';

		complexEntity.simpleEntity = simpleEntity1;

		const simpleEntity2 = new SimpleEntity();
		simpleEntity2.id = 2;
		simpleEntity2.name = 'Test-2';

		const simpleEntity3 = new SimpleEntity();
		simpleEntity3.id = 3;
		simpleEntity3.name = 'Test-3';

		const simpleEntity4 = new SimpleEntity();
		simpleEntity4.id = 4;
		simpleEntity4.name = 'Test-4';

		complexEntity.simpleEntities = [simpleEntity2, simpleEntity3, simpleEntity4];

		const userStorageValue = await complexEntity.toStorage();

		assert.equal(userStorageValue.firstName, 'test');
		assert.equal(userStorageValue.lastName, 'tester');
		assert.equal(userStorageValue.verification, `{"verified":true,"documentType":"driversLicense"}`);
		assert.equal(userStorageValue.tags, `[{"slug":"no-name","label":"No Name"},{"slug":"adult-user","label":"Adult User"}]`);
		assert.equal(userStorageValue.simpleEntity, 1);
		assert.equal(userStorageValue.simpleEntities, '[2,3,4]');
	});
});

