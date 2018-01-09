const { validation } = require('./../src');

describe('phone test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'phone');
    });

    it('should fail - value contains invalid characters', async () => {
        try {
            await validation.validate('"""£@!DAs12312', 'phone');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - only numbers', async () => {
        await validation.validate('0911231232', 'phone')
    });

    it('should pass with slashes and hyphens', async () => {
        await validation.validate('091/123-1232', 'phone')
    });

    it('should pass with plus sign as a prefix and round brackets', async () => {
        await validation.validate('+(091)/4123-3212', 'phone')
    });
});