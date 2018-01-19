import {assert} from 'chai';
import User from './entities/user'

describe('set test', function () {
    it('should set values correctly', async () => {
        const user = new User();

        user.firstName = 'John';
        user.lastName = 'Doe';
        user.age = 12;
        user.enabled = true;

        assert.equal(user.firstName, 'John');
        assert.equal(user.lastName, 'Doe');
        assert.equal(user.age, 12);
        assert.equal(user.enabled, true);
    });
});