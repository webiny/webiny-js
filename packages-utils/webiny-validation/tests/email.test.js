const { validation } = require('./../src');

describe('email test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'email');
    });

    it('should fail - a number was sent', async () => {
        try {
            await validation.validate(12, 'email')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should fail - TLD missing', async () => {
        try {
            await validation.validate('asd@google', 'email')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should fail - contains a space', async () => {
        try {
            await validation.validate('asd asd@google.com', 'email')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass', async () => {
        await validation.validate('webiny@webiny.com', 'email');
        await validation.validate('webiny@webiny.io', 'email');
    });
});