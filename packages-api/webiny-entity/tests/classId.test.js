import {assert} from 'chai';
import User from './entities/user'

describe('class ID test', function () {
    it('should be able to access classId on a class', async () => {
        assert.equal(User.classId, 'User');
    });

    it('should be able to access classId on an instance', async () => {
        const user = new User();
        assert.equal(user.classId, 'User');
    });
});