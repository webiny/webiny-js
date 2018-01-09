import {assert} from 'chai';
const Model = require('./../../src/model');
const ModelError = require('./../../src/modelError');

const model = new Model(function () {
    this.attr('attribute').boolean();
});

describe('attribute boolean test', function () {
    it('should accept boolean values', () => {
        model.attribute = false;
        assert.equal(model.attribute, false);

        model.attribute = true;
        assert.equal(model.attribute, true);
    });

    [1000, 0, 0.5, {}, [], undefined, null, 'some string'].forEach(value => {
        it(`shouldn\'t accept ${typeof value}`, async () => {
            let error = null;
            try {
                model.attribute = value;
                await model.validate();
            } catch (e) {
                error = e;
            }

            assert.instanceOf(error, ModelError);
            assert.equal(error.getType(), ModelError.INVALID_ATTRIBUTES);
        });
    });

});