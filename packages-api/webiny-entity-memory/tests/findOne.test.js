import {assert} from 'chai';
import SimpleEntity from './entities/simpleEntity';

describe('findOne test', function () {
    it('findOne - should find previously inserted entity', async () => {
        const simpleEntity = await SimpleEntity.findOne({query: {id: 1}});
		assert.equal(simpleEntity.id, 1);
        assert.equal(simpleEntity.name, 'This is a test');
        assert.equal(simpleEntity.slug, 'thisIsATest');
        assert.isTrue(simpleEntity.enabled);
    });
});