import { validation } from './../src';
import './chai';

describe('maxLength test', () => {
    it('should not get triggered if an empty value was set', () => {
        return validation.validate(null, 'maxLength').should.be.fulfilled;
    });

    it('should fail - string has more than 5 characters', () => {
        return validation.validate('abcdef', 'maxLength:5').should.be.rejected;
    });

    it('should pass - string has less than 5 characters', () => {
        return Promise.all([
            validation.validate('abc', 'maxLength:5').should.become(true),
            validation.validate('abcde', 'maxLength:5').should.become(true)
        ]);
    });

    it('should fail - array has more than 5 elements', () => {
        return validation.validate([1, 2, 3, 4, 5, 6], 'maxLength:5').should.be.rejected;
    });

    it('should pass - array has less than 5 elements', () => {
        return Promise.all([
            validation.validate([1, 2, 3], 'maxLength:5').should.become(true),
            validation.validate([1, 2, 3, 4, 5], 'maxLength:5').should.become(true)
        ]);
    });
});