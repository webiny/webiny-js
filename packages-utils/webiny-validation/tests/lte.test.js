const { validation } = require('./../src');

describe('lte test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'lte');
    });

    it('should fail - numbers are not lower', async () => {
        try {
            await validation.validate(13.1, 'lte:13');
            await validation.validate(100.0000001, 'lte:100');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - numbers are lower', async () => {
        await validation.validate(2, 'lte:11');
        await validation.validate(11.9899999999999, 'lte:11.99');
    });

    it('should pass - numbers are equal', async () => {
        await validation.validate(12, 'lte:12');
        await validation.validate(0.54, 'lte:0.54');
    });

    it('should pass - numbers are lower', async () => {
        await validation.validate(10, 'lte:12');
        await validation.validate(0, 'lte:0.54');
    });
});