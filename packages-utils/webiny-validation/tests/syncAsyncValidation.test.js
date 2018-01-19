import { validation, ValidationError } from './../src';
import chai from './chai';

const { expect } = chai;

describe('async/sync validation test', () => {
    it('must validate asynchronously', async () => {
        expect(validation.validate('test', 'required')).to.become(true);
        expect(validation.validate('', 'required')).to.be.rejectedWith(ValidationError);
    });

    it('must validate synchronously', async () => {
        expect(validation.validateSync('test', 'required')).to.be.true;
        expect(() => validation.validateSync('', 'required')).to.throw(ValidationError);
    });
});