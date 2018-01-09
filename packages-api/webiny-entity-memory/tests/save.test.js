import {assert} from 'chai';
const SimpleEntity = require('./entities/simpleEntity');

describe('save test', function () {
	it('should save new and update entity correctly', async () => {
		SimpleEntity.getDriver().flush();

		const simpleEntity = new SimpleEntity();
		simpleEntity.name = 'Test1';
		await simpleEntity.save();
		assert.lengthOf(simpleEntity.id, 24);

		const id = simpleEntity.id;
		
		const foundEntity = await SimpleEntity.findById(id);
		assert.equal(foundEntity.id, id);
		assert.equal(foundEntity.name, 'Test1');
		
		foundEntity.name = 'Test2';
		await foundEntity.save();

		const foundEntity2 = await SimpleEntity.findById(foundEntity.id);
		assert.equal(foundEntity2.name, 'Test2');
	});
});