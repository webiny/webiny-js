const { validation } = require('./../src');

describe('multiple validators test', () => {
    it('should fail - value not set', async () => {
        try {
            await validation.validate('', 'required');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - e-mail set', async () => {
        await validation.validate('email@webiny', 'required');
    });

    it('should fail -  e-mail set but not valid', async () => {
        try {
            await validation.validate('email@webiny', 'required,email');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - valid e-mail set', async () => {
        await validation.validate('email@webiny.com', 'required,email');
    });

    it('should pass - number set', async () => {
        await validation.validate(15.5, 'required');
    });

    it('should fail - number set but not greater than 100', async () => {
        try {
            await validation.validate(15.5, 'required,gt:100');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - number greater than 100 set', async () => {
        await validation.validate(250, 'required,gt:100');
    });

    it('should fail - number set, greater than 100 but not lower than 200', async () => {
        try {
            await validation.validate(250, 'required,gt:100,lt:200');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - number greater than 100 and lower than 200', async () => {
        await validation.validate(150, 'required,gt:100,lt:200');
    });

    it('should fail - number set, greater than 100, lower than 200, but not integer', async () => {
        try {
            await validation.validate('150.150', 'required,gt:100,lt:200,integer');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - integer number set, greater than 100, lower than 200', async () => {
        try {
            await validation.validate('150.150', 'required,gt:100,lt:200,integer');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });
});