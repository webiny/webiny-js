import {assert} from 'chai';
const Model = require('./../../src/model');
const ModelError = require('./../../src/modelError');

const model = new Model(function () {
    this.attr('attribute').date();
});

describe('attribute boolean test', function () {
    it('should accept Date object as value', () => {
        model.attribute = new Date();
        assert.isDefined(model.attribute);
        assert.instanceOf(model.attribute, Date);
    });

    [1000, 0, 0.5, {}, [], undefined, null, 'some string', true, false].forEach(value => {
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