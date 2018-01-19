import { validation } from './../src';
import './chai';

describe('minLength test', () => {
    it('should not get triggered if an empty value was set', () => {
        return validation.validate(null, 'minLength').should.be.fulfilled;
    });

    it('should fail - string has less than 5 characters', () => {
        return validation.validate('abcd', 'minLength:5').should.be.rejected;
    });

    it('should pass - string has more than 5 characters', () => {
        return Promise.all([
            validation.validate('abcde', 'minLength:5').should.become(true),
            validation.validate('abcdefgh', 'minLength:5').should.become(true)
        ]);
    });

    it('should fail - array has less than 5 elements', () => {
        return validation.validate([1, 2, 3, 4], 'minLength:5').should.be.rejected;
    });

    it('should pass - array has more than 5 elements', () => {
        return Promise.all([
            validation.validate([1, 2, 3, 4, 5], 'minLength:5').should.become(true),
            validation.validate([1, 2, 3, 4, 5, 6, 7], 'minLength:5').should.become(true)
        ]);
    });
});