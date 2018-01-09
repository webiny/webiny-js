const { validation } = require('./../src');
import {assert} from 'chai';

describe('calling validation without setting validators', () => {
    it('should return null since validators were not sent', async () => {
        const res = await validation.validate('test', '');
        assert.equal(res, null);
    });
});