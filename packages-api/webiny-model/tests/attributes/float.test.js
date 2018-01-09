import {assert} from 'chai';
const Model = require('./../../src/model');
const ModelError = require('./../../src/modelError');

const model = new Model(function () {
    this.attr('attribute').float();
});

describe('attribute float test', function () {
    it('should accept float values', () => {
        model.attribute = 5.5;
        assert.equal(model.attribute, 5.5);

        model.attribute = 0;
        assert.equal(model.attribute, 0);
    });

    ['1', '0', '0.5', {}, [], undefined, null, true, false].forEach(value => {
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

    it('should be able to add numbers and set the total as a new value', () => {
        model.attribute = 5;
        assert.equal(model.attribute, 5);

        model.attribute = model.attribute + 5;
        assert.equal(model.attribute, 10);

        model.attribute += 5;
        assert.equal(model.attribute, 15);
    });
});