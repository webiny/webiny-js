const {Entity, Driver} = require('./../src');
const {attributes} = require('webiny-model');
import {assert} from 'chai';

describe('overriding ID attribute test', function () {
	it('should have char ID attribute by default', async () => {
		class ExtendedEntityDriver extends Driver {}

		class ExtendedEntity extends Entity {}
		ExtendedEntity.driver = new ExtendedEntityDriver();


		const entity = new ExtendedEntity();
		assert.instanceOf(entity.getAttribute('id'), attributes.char);
	});

	it('should have ID attribute overridden by driver', async () => {
		class ExtendedEntityDriver extends Driver {
			onEntityConstruct(entity) {
				entity.attr('id').integer();
			}
		}

		class ExtendedEntity extends Entity {}
		ExtendedEntity.driver = new ExtendedEntityDriver();

		const entity = new ExtendedEntity();
		assert.instanceOf(entity.getAttribute('id'), attributes.integer);
	});
});