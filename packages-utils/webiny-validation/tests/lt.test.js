const { validation } = require('./../src');

describe('lt test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'lt');
    });

    it('should fail - numbers are not lower', async () => {
        try {
            await validation.validate(12, 'lt:12');
            await validation.validate(123, 'lt:100');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - numbers are lower', async () => {
        await validation.validate(10, 'lt:11');
        await validation.validate(11, 'lt:11.99');
    });
});