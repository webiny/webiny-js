import {assert} from 'chai';
const User = require('./entities/User');

describe('class ID test', function () {
    it('should be able to access classId on a class', async () => {
        assert.equal(User.classId, 'User');
    });

    it('should be able to access classId on an instance', async () => {
        const user = new User();
        assert.equal(user.classId, 'User');
    });
});