const { validation } = require('./../src');

describe('minLength test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'minLength');
    });

    it('should fail - string has less than 5 characters', async () => {
        try {
            await validation.validate('abcd', 'minLength:5');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - string has more than 5 characters', async () => {
        await validation.validate('abcde', 'minLength:5');
        await validation.validate('abcdefgh', 'minLength:5');
    });

    it('should fail - array has less than 5 elements', async () => {
        try {
            await validation.validate([1, 2, 3, 4], 'minLength:5');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - array has more than 5 elements', async () => {
        await validation.validate([1, 2, 3, 4, 5], 'minLength:5');
        await validation.validate([1, 2, 3, 4, 5, 6, 7], 'minLength:5');
    });
});