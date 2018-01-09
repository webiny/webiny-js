import {assert} from 'chai';
const BasicModel = require('./models/basicModel.js');

const model = new BasicModel;

describe('class model test', function () {
    it('should return three attributes when getAttributes is called', () => {
        assert.hasAllKeys(model.getAttributes(), ['attr1', 'attr2', 'attr3']);
    });

    it('should return attribute when called with getAttribute is called', () => {
        assert.isDefined(model.getAttribute('attr1'));
        assert.isDefined(model.getAttribute('attr2'));
        assert.isDefined(model.getAttribute('attr3'));
    });
});