import {assert} from 'chai';
import User from './entities/user'

describe('set test', function () {
    it('should fail because attribute doesn\'t exist', async () => {
        const user = new User();
		user.nonExistingAttr = 'John';
		assert.equal(user.nonExistingAttr, 'John');
    });
});