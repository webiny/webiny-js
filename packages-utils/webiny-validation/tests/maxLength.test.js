const { validation } = require('./../src');

describe('maxLength test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'maxLength');
    });

    it('should fail - string has more than 5 characters', async () => {
        try {
            await validation.validate('abcdef', 'maxLength:5');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - string has less than 5 characters', async () => {
        await validation.validate('abc', 'maxLength:5');
        await validation.validate('abcde', 'maxLength:5');
    });

    it('should fail - array has more than 5 elements', async () => {
        try {
            await validation.validate([1, 2, 3, 4, 5, 6], 'maxLength:5');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - array has less than 5 elements', async () => {
        await validation.validate([1, 2, 3], 'maxLength:5');
        await validation.validate([1, 2, 3, 4, 5], 'maxLength:5');
    });
});