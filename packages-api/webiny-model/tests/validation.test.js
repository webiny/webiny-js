import {assert} from 'chai';
const ModelError = require('./../src/modelError');
const ValidationTestModel = require('./models/validationTestModel.js');

describe('validation test', function () {
    it('should throw an error because required fields are missing', async () => {
        const model = new ValidationTestModel();

        let error = null;
        try {
            await model.populate({});
            await model.validate();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(error.getType(), ModelError.INVALID_ATTRIBUTES);

        assert.isDefined(error.getData().invalidAttributes.email);
        assert.isDefined(error.getData().invalidAttributes.required1);
        assert.isDefined(error.getData().invalidAttributes.required2);
    });

    it('should throw an error because e-mail is in invalid format', async () => {
        const model = new ValidationTestModel();

        let error = null;
        try {
            await model.populate({email: '1234', required1: 'something', required2: 'something'});
            await model.validate();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(error.getType(), ModelError.INVALID_ATTRIBUTES);

        assert.isDefined(error.getData().invalidAttributes.email);
        assert.isUndefined(error.getData().invalidAttributes.required1);
        assert.isUndefined(error.getData().invalidAttributes.required2);
    });

    it('should\'t throw errors because all attributes are in order', async () => {
        const model = new ValidationTestModel();

        let error = null;
        try {
            await model.populate({email: 'john@gmail.com', required1: 'something', required2: 'something'});
        } catch (e) {
            error = e;
        }

        assert.isNull(error);
    });

    // TODO: in ne radi!!!!!!!! mozda je u validationu greska ?!
});