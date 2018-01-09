const { validation } = require('./../src');

describe('gte test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'gte');
    });

    it('should fail - numbers are not greater', async () => {
        try {
            await validation.validate(12, 'gte:13');
            await validation.validate(12, 'gte:100');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - numbers are equal', async () => {
        await validation.validate(12, 'gte:12');
        await validation.validate(0.54, 'gte:0.54');
    });

    it('should pass - numbers are greater', async () => {
        await validation.validate(12, 'gte:10');
        await validation.validate(0.54, 'gte:0');
    });
});