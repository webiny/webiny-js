import {assert} from 'chai';
const sinon = require('sinon');
const SimpleEntity = require('./entities/simpleEntity');

describe('findOne test', function () {
    it('findOne - should find previously inserted entity', async () => {
        sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
            callback(null, [
                {
                    "id": 1,
                    "name": "This is a test",
                    "slug": "thisIsATest",
                    "enabled": 1
                }
            ], null);
        });
		sinon.stub(SimpleEntity.getDriver().getConnection(), 'end').callsFake(() => {});

        const simpleEntity = await SimpleEntity.findOne({query: {id: 1}});
		SimpleEntity.getDriver().getConnection().query.restore();
		SimpleEntity.getDriver().getConnection().end.restore();

		assert.equal(simpleEntity.id, 1);
        assert.equal(simpleEntity.name, 'This is a test');
        assert.equal(simpleEntity.slug, 'thisIsATest');
        assert.isTrue(simpleEntity.enabled);
    });
});