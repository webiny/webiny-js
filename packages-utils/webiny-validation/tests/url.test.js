const { validation } = require('./../src');

describe('url test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'url');
    });

    it('should fail - invalid URL', async () => {
        try {
            await validation.validate('asd', 'url');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should fail - IP address is valid but "noIp" option is set', async () => {
        try {
            await validation.validate('http://192.167.1.2', 'url:noIp');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - URL is valid and "noIp" option is set', async () => {
        await validation.validate('http://www.google.com', 'url:noIp');
    });

    it('should fail - no TLD', async () => {
        try {
            await validation.validate('http://localhost', 'url');
        } catch (e) {
            return;
        }
        throw Error('Error should have been thrown.');
    });

    it('should pass - a valid IP was given', async () => {
        await validation.validate('http://192.167.1.2', 'url');
    });

    it('should pass - a valid HTTP URL given', async () => {
        await validation.validate('http://www.google.com', 'url');
    });

    it('should pass - a valid HTTPS URL given', async () => {
        await validation.validate('https://www.google.com', 'url');
    });
});