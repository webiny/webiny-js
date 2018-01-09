const { validation } = require('./../src');

describe('in test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'in');
    });

    it('should fail - value not in the list', async () => {
        try {
            await validation.validate('ab', 'in:abc:123')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should fail - value not in the list', async () => {
        try {
            await validation.validate(12, 'in:abc:123')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass', async () => {
        await validation.validate('abc', 'in:abc:123');
        await validation.validate('123', 'in:abc:123');
        await validation.validate(123, 'in:abc:123');
    });
});