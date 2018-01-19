import {assert} from 'chai';
import {EntityError} from './../src'

describe('entity error test', function () {
    it('should set default entity error values', async () => {
        const e = new EntityError('Test');
        assert.equal(e.getMessage(), 'Test');
        assert.equal(e.getType(), null);
        assert.equal(e.getData(), null);
    });

    it('should set message, type and data', async () => {
        const e = new EntityError('Test', 'test', {test: true});
        assert.equal(e.getMessage(), 'Test');
        assert.equal(e.getType(), 'test');
        assert.equal(e.getData().test, true);
    });

    it('should set message, type and data using setter methods', async () => {
        const e = new EntityError('Test', 'test', {test: true});
        assert.equal(e.getMessage(), 'Test');
        assert.equal(e.getType(), 'test');
        assert.equal(e.getData().test, true);

        e.setMessage('Test2').setType('test2').setData({test: false});
        assert.equal(e.getMessage(), 'Test2');
        assert.equal(e.getType(), 'test2');
        assert.equal(e.getData().test, false);
    });
});