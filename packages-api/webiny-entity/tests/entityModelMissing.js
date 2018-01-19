import {Entity, Driver} from './../src'
import {assert} from 'chai';

class ExtendedEntityDriver extends Driver {
	constructor() {
		super();
	}

	getModelClass() {
		return null;
	}
}

class ExtendedEntity extends Entity {

}

ExtendedEntity.driver = new ExtendedEntityDriver();
describe('entity model missing test', function () {
    it('should throw an exception because entity model is missing', async () => {
    	let error = null;
    	try {
			new ExtendedEntity();
		} catch (e) {
    		error = e;
		}

		assert.instanceOf(error, Error);

    });
});