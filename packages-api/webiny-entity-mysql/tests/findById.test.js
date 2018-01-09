import {assert} from 'chai';
const sinon = require('sinon');
const SimpleEntity = require('./entities/simpleEntity');

describe('findById test', function () {
    it('findById - should find previously inserted entity', async () => {
        sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
            callback(null, [
                {
                    "id": 1,
                    "name": "This is a test",
                    "slug": "thisIsATest",
                    "enabled": 1
                }
            ]);
        });

        const simpleEntity = await SimpleEntity.findById(1);
		SimpleEntity.getDriver().getConnection().query.restore();

		assert.equal(simpleEntity.id, 1);
        assert.equal(simpleEntity.name, 'This is a test');
        assert.equal(simpleEntity.slug, 'thisIsATest');
        assert.isTrue(simpleEntity.enabled);
    });
});