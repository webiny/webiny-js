const { validation } = require('./../src');

describe('creditCard test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'creditCard');
    });

    it('should fail - a string was sent', async () => {
        try {
            await validation.validate('creditCardNumber', 'creditCard')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });


    it('should fail - a number was sent', async () => {
        try {
            await validation.validate(12, 'creditCard')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should fail - a random long number was sent', async () => {
        try {
            await validation.validate('12312317238127391', 'creditCard')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should fail - less than 12 digits sent', async () => {
        try {
            await validation.validate('42424242424', 'creditCard')
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - a valid credit card number was sent', async () => {
        await validation.validate('4242424242424242', 'creditCard');
    });

    it('should pass - a valid credit card with dashes between groups of 4 numbers was sent', async () => {
        await validation.validate('4242-4242-4242-4242', 'creditCard');
    });
});