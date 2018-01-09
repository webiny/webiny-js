const { validation, ValidationError } = require('./../src');
import {assert} from 'chai';

validation.setValidator('gender', value => {
    if (!value) return;
    value = value + '';

    if (['male', 'female'].includes(value)) {
        return;
    }
    throw new ValidationError('Value needs to be "male" or "female".');
});

describe('gt test', () => {
    it('should not get triggered if an empty value was set', async () => {
        await validation.validate('', 'gender');
    });

    it('should return newly registered "gender" validator', async () => {
        assert.isFunction(validation.getValidator('gender'));
    });

    it('should fail - invalid gender set', async () => {
        let result;
        try {
            result = await validation.validate('none', 'gender');
        } catch (e) {
            result = e;
        }
        assert.instanceOf(result, ValidationError);
    });

    it('should pass - valid gender set', async () => {
        await validation.validate('female', 'gender');
    });
});

