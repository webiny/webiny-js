import {assert} from 'chai';
const User = require('./entities/User');

describe('set test', function () {
    it('should fail because attribute doesn\'t exist', async () => {
        const user = new User();
		user.nonExistingAttr = 'John';
		assert.equal(user.nonExistingAttr, 'John');
    });
});