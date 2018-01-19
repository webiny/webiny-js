import { validation, ValidationError } from './../src';
import chai from './chai';

const { assert, expect } = chai;

describe('disabling error throwing test', () => {
    it('by default it must throw errors on invalid data', async () => {
        let error = null;
        try {
            await validation.validate('1234567890', 'required,email,minLength:5');
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ValidationError);

        assert.isString(error.getMessage());
        assert.equal(error.getValidator(), 'email');
        assert.equal(error.getValue(), '1234567890');

        error.setMessage('123');
        error.setValidator('xyz');
        error.setValue('abc');

        assert.equal(error.getMessage(), '123');
        assert.equal(error.getValidator(), 'xyz');
        assert.equal(error.getValue(), 'abc');

    });

    it('should not throw errors when options\' throw flag is set to false', () => {
        // Sync
        expect(validation.validateSync('', 'required', { throw: false })).to.deep.equal({
            "message": "Value is required.",
            "name": "required",
            "value": ""
        });

        // Async
        expect(validation.validate('', 'required', { throw: false })).to.become({
            "message": "Value is required.",
            "name": "required",
            "value": ""
        });
    });
});