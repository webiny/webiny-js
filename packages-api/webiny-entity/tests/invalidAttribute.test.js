import {assert} from 'chai';
const User = require('./entities/user');

describe('invalid attribute test', function () {
    it('should throw an error - attribute doesn\'t exist', async () => {
        const user = new User();
		user.something = 123;
		assert.equal(user.something, 123);
    });
});