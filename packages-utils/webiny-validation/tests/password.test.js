const { validation } = require('./../src');

describe('password test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'password');
    });

    it('should fail - values are too short', async () => {
        try {
            await validation.validate('12312', 'password')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - value is long enough', async () => {
        await validation.validate('123123', 'password');
    });
});