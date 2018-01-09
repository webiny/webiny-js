const { validation } = require('./../src');

describe('number test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate(null, 'number');
    });

    it('should fail - values are not numbers', () => {
        const values = [NaN, true, [], 'asd', '{}', {}, '123.x', '11', '11.3211'];

        return Promise.all(values.map(async value => {
            try {
                await validation.validate(value, 'number');
            } catch (e) {
                return;
            }
            throw Error('Should not pass validation: "' + value+'"');
        }));
    });
    

    it('should pass - valid numbers given', async () => {
        await validation.validate(11, 'number');
        await validation.validate(11.434242, 'number');
    });
});