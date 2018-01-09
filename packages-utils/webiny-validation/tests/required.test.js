const { validation } = require('./../src');

describe('required test', () => {
    it('should fail - empty string sent', async () => {
        try {
            await validation.validate('', 'required');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should fail - null sent', async () => {
        try {
            await validation.validate(null, 'required');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - non-empty string given', async () => {
        await validation.validate('0911231232', 'required');
    });

    it('should pass - number given', async () => {
        await validation.validate(1, 'required');
    });

    it('should pass - number "0" given (it is still a valid value)', async () => {
        await validation.validate(0, 'required');
    });
});