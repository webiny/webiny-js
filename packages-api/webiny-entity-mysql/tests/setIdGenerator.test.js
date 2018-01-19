import {assert} from 'chai';
import SimpleEntity from './entities/simpleEntity'

describe('set/get custom id generator handler flag test', function () {
	it('setHashIds / getHashIds - should set/get value correctly', async () => {
		SimpleEntity.getDriver().setIdGenerator(() => {});
		assert.isFunction(SimpleEntity.getDriver().getIdGenerator());

		SimpleEntity.getDriver().setIdGenerator(null);
		assert.isNull(SimpleEntity.getDriver().getIdGenerator());
	});
});