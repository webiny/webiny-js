import {assert} from 'chai';
const Model = require('./../src/model');

describe('dirty and clean test', function () {
    it('should make attributes dirty', async () => {
        const model = new Model(function () {
            this.attr('firstName').char();
            this.attr('lastName').char();
            this.attr('number').integer();
            this.attr('createdOn').date();
        });

        assert.isTrue(model.isClean());

        model.lastName = 'Test1';


		assert.isFalse(model.getAttribute('firstName').value.isDirty());
		assert.isTrue(model.getAttribute('lastName').value.isDirty());
		assert.isFalse(model.getAttribute('number').value.isDirty());
		assert.isFalse(model.getAttribute('createdOn').value.isDirty());

		assert.isFalse(model.isClean());

		model.clean();
		assert.isTrue(model.isClean());

		model.lastName = 'Test1';
		assert.isTrue(model.isClean());

		model.lastName = 'Test2';
		assert.isFalse(model.isClean());
	});
});