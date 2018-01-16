import {assert} from 'chai';

const {ComplexEntity, SimpleEntity} = require('./entities/complexEntity');

describe('populateFromStorage test', function () {
	it('should populate entity correctly with data received from memory', async () => {
		SimpleEntity.getDriver()
			.flush('ComplexEntity')
			.import('ComplexEntity', [
				{
					id: 'A',
					firstName: 'test',
					lastName: 'tester',
					verification: {"verified": true, "documentType": "driversLicense"},
					tags: [{"slug": "no-name", "label": "No Name"}, {"slug": "adult-user", "label": "Adult User"}],
					simpleEntity: 'A',
					simpleEntities: ['B', 'C', 'D']
				}
			])
			.flush('SimpleEntity')
			.import('SimpleEntity', [
				{
					"id": 'A',
					"name": "Test-A"
				},
				{
					"id": 'B',
					"name": "Test-B"
				},
				{
					"id": 'C',
					"name": "Test-C"
				}, {
					"id": 'D',
					"name": "Test-D"
				}
			]);


		const complexEntity = await ComplexEntity.findById('A');

		assert.deepEqual(complexEntity.getAttribute('simpleEntities').value.status, {loading: false, loaded: false});

		assert.equal(complexEntity.firstName, 'test');
		assert.equal(complexEntity.lastName, 'tester');
		assert.isTrue(complexEntity.verification.verified);
		assert.equal(complexEntity.verification.documentType, 'driversLicense');
		assert.equal(complexEntity.tags[0].slug, 'no-name');
		assert.equal(complexEntity.tags[0].label, 'No Name');
		assert.equal(complexEntity.tags[1].slug, 'adult-user');
		assert.equal(complexEntity.tags[1].label, 'Adult User');
		assert.lengthOf(complexEntity.tags, 2);

		assert.deepEqual(complexEntity.getAttribute('simpleEntities').value.status, {loading: false, loaded: false});
		assert.equal(complexEntity.getAttribute('simpleEntities').value.current[0], 'B');
		assert.equal(complexEntity.getAttribute('simpleEntities').value.current[1], 'C');
		assert.equal(complexEntity.getAttribute('simpleEntities').value.current[2], 'D');

		assert.equal(complexEntity.getAttribute('simpleEntity').value.current, 'A');
		const simpleEntity = await complexEntity.simpleEntity;
		assert.equal(simpleEntity.id, 'A');
		assert.equal(simpleEntity.name, 'Test-A');

		const simpleEntities = await complexEntity.simpleEntities;
		assert.deepEqual(complexEntity.getAttribute('simpleEntities').value.status, {loading: false, loaded: true});

		assert.lengthOf(simpleEntities, 3);

		assert.instanceOf(simpleEntities[0], SimpleEntity);
		assert.equal(simpleEntities[0].id, 'B');
		assert.equal(simpleEntities[0].name, 'Test-B');

		assert.instanceOf(simpleEntities[1], SimpleEntity);
		assert.equal(simpleEntities[1].id, 'C');
		assert.equal(simpleEntities[1].name, 'Test-C');

		assert.instanceOf(simpleEntities[2], SimpleEntity);
		assert.equal(simpleEntities[2].id, 'D');
		assert.equal(simpleEntities[2].name, 'Test-D');
	});
});