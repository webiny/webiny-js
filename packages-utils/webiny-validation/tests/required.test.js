import { validation } from './../src';
import './chai';

describe('required test', () => {
    it('should fail - empty string sent', () => {
        return validation.validate('', 'required').should.be.rejected;
    });

    it('should fail - null sent', () => {
        return validation.validate(null, 'required').should.be.rejected;
    });

    it('should pass - non-empty string given', () => {
        return validation.validate('0911231232', 'required').should.become(true);
    });

    it('should pass - number given', () => {
        return validation.validate(1, 'required').should.become(true);
    });

    it('should pass - number "0" given (it is still a valid value)', () => {
        return validation.validate(0, 'required').should.become(true);
    });
});