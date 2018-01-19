import { validation } from './../src';
import './chai';

describe('number test', () => {
    it('should not get triggered if an empty value was set', () => {
        return validation.validate(null, 'number').should.be.fulfilled;
    });

    it('should fail - values are not numbers', () => {
        const values = [NaN, true, [], 'asd', '{}', {}, '123.x', '11', '11.3211'];

        return Promise.all(values.map(value => {
            return validation.validate(value, 'number').should.be.rejected;
        }));
    });


    it('should pass - valid numbers given', () => {
        return Promise.all([
            validation.validate(11, 'number').should.become(true),
            validation.validate(11.434242, 'number').should.become(true)
        ]);
    });
});