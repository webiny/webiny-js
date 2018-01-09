const { validation } = require('./../src');

describe('gt test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'gt');
    });

    it('should fail - numbers are not greater', async () => {
        try {
            await validation.validate(12, 'gt:12');
            await validation.validate(12, 'gt:100');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - numbers are greater', async () => {
        await validation.validate(12, 'gt:11');
        await validation.validate(12, 'gt:11.999999999');
    });
});