import {assert} from 'chai';
const Model = require('./../src/model');

describe('onGet test', function () {
    it('should increment value by 2 on get', async () => {
        const model = new Model(function () {
            this.attr('number').integer().onGet(value => value + 2);
        });

        model.populate({number: 2});
		assert.equal(model.getAttribute('number').value.current, 2);
		assert.equal(model.number, 4)
    });
});