import {assert} from 'chai';
const sinon = require('sinon');
const SimpleEntity = require('./entities/simpleEntity');

describe('count test', function () {
	it('count - should count entities', async () => {
		sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
			callback(null, [{"count": 1}]);
		});

		const count = await SimpleEntity.count();
		SimpleEntity.getDriver().getConnection().query.restore();

		assert.equal(count, 1);
	});
});