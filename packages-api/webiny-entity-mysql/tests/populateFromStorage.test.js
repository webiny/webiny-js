import {assert} from 'chai';

const sinon = require('sinon');
const {ComplexEntity, SimpleEntity} = require('./entities/complexEntity');

describe('populateFromStorage test', function () {
	it('should populate entity correctly with data received from MySQL', async () => {
		sinon.stub(ComplexEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
			callback(null, [{
				firstName: 'test',
				lastName: 'tester',
				verification: `{"verified":true,"documentType":"driversLicense"}`,
				tags: `[{"slug":"no-name","label":"No Name"},{"slug":"adult-user","label":"Adult User"}]`,
				simpleEntity: 'A',
				simpleEntities: '["B","C","D"]'
			}]);
		});

		const user = await ComplexEntity.findById('A');
		ComplexEntity.getDriver().getConnection().query.restore();

		assert.equal(user.firstName, 'test');
		assert.equal(user.lastName, 'tester');
		assert.isTrue(user.verification.verified);
		assert.equal(user.verification.documentType, 'driversLicense');
		assert.equal(user.tags[0].slug, 'no-name');
		assert.equal(user.tags[0].label, 'No Name');
		assert.equal(user.tags[1].slug, 'adult-user');
		assert.equal(user.tags[1].label, 'Adult User');
		assert.lengthOf(user.tags, 2);

		sinon.stub(user.getDriver().getConnection(), 'query').callsFake((query, callback) => {
			callback(null, [{id: 1, name: 'Test-1'}]);
		});

		const simpleEntity = await user.simpleEntity;
		assert.equal(user.getAttribute('simpleEntity').value.current, 'A');
		user.getDriver().getConnection().query.restore();

		assert.equal(simpleEntity.id, 1);
		assert.equal(simpleEntity.name, 'Test-1');

		assert.equal(user.getAttribute('simpleEntities').value.current[0], 'B');
		assert.equal(user.getAttribute('simpleEntities').value.current[1], 'C');
		assert.equal(user.getAttribute('simpleEntities').value.current[2], 'D');

		sinon.stub(user.getDriver().getConnection(), 'query')
			.onCall(0)
			.callsFake((query, callback) => {
				callback(null, [
					{id: 2, name: 'Test-2'},
					{id: 3, name: 'Test-3'},
					{id: 4, name: 'Test-4'},
				]);
			})
			.onCall(1)
			.callsFake((query, callback) => {
				callback(null, [{count: 3}]);
			});

		assert.lengthOf(await user.simpleEntities, 3);

		const simpleEntities = await user.simpleEntities;
		assert.instanceOf(simpleEntities[0], SimpleEntity);
		assert.equal(simpleEntities[0].id, 2);
		assert.equal(simpleEntities[0].name, 'Test-2');

		assert.instanceOf(simpleEntities[1], SimpleEntity);
		assert.equal(simpleEntities[1].id, 3);
		assert.equal(simpleEntities[1].name, 'Test-3');

		assert.instanceOf(simpleEntities[2], SimpleEntity);
		assert.equal(simpleEntities[2].id, 4);
		assert.equal(simpleEntities[2].name, 'Test-4');

		user.getDriver().getConnection().query.restore();
	});
});

