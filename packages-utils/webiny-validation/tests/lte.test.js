import { validation } from './../src';
import './chai';

describe('lte test', () => {
    it('should not get triggered if an empty value was set', () => {
        return validation.validate(null, 'lte').should.be.fulfilled;
    });

    it('should fail - numbers are not lower', () => {
        return Promise.all([
            validation.validate(13.1, 'lte:13').should.be.rejected,
            validation.validate(100.0000001, 'lte:100').should.be.rejected
        ]);
    });

    it('should pass - numbers are lower', () => {
        return Promise.all([
            validation.validate(2, 'lte:11').should.become(true),
            validation.validate(11.9899999999999, 'lte:11.99').should.become(true)
        ]);
    });

    it('should pass - numbers are equal', () => {
        return Promise.all([
            validation.validate(12, 'lte:12').should.become(true),
            validation.validate(0.54, 'lte:0.54').should.become(true)
        ]);
    });

    it('should pass - numbers are lower', () => {
        return Promise.all([
            validation.validate(10, 'lte:12').should.become(true),
            validation.validate(0, 'lte:0.54').should.become(true)
        ]);
    });
});