import {assert} from 'chai';
const User = require('./entities/user');

describe('driver override test', function () {
    it('should validate given ID correctly (static call)', async () => {
    	assert.isFalse(User.isId(123));
    	assert.isTrue(User.isId('asd'));
    });

    it('should validate given ID correctly (static call)', async () => {
    	const user = new User();
    	assert.isFalse(user.isId(123));
    	assert.isTrue(user.isId('asd'));
    });
});