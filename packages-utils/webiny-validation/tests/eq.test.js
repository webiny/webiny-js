const { validation } = require('./../src');

describe('eq test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'eq');
    });

    it('should fail - value not equal', async () => {
        try {
            await validation.validate(12, 'eq:123')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should fail - value not equal', async () => {
        try {
            await validation.validate('test', 'eq:105')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });
    
    it('should fail - value not equal', async () => {
        try {
            await validation.validate('text', 'eq:105')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should fail - value not equal', async () => {
        try {
            await validation.validate({}, 'eq:105')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');

    });

    it('should pass - strings are the same', async () => {
        await validation.validate('test', 'eq:test');
        await validation.validate('text', 'eq:text');
    });

    it('should pass - in spite of data types being different', async () => {
        await validation.validate(11, 'eq:11');
        await validation.validate(11.99, 'eq:11.99');
    });
});