import {assert} from 'chai';
const User = require('./entities/user');

describe('toJSON test', function () {
    it('should extract values correctly', async () => {
        const user = new User();

        user.firstName = 'John';
        user.lastName = 'Doe';
        user.age = 12;
        user.enabled = true;

        const data = await user.toJSON('firstName,age');
        assert.hasAllKeys(data, ['firstName', 'age']);
        assert.equal(data.firstName, 'John');
        assert.equal(data.age, 12);
    });
});