const { validation } = require('./../src');

describe('integer test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'integer');
    });

    it('should fail - values are not integers', async () => {
        try {
            await validation.validate(12.2, 'integer');
            await validation.validate('123.32', 'integer');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - valid integers given', async () => {
        await validation.validate(11, 'integer');
        await validation.validate('11', 'integer');
    });
});