import {assert} from 'chai';

import {QueryResult} from '../../../src/index'
import {User, Company} from '../../entities/userCompanyImage'
import {One} from '../../entities/oneTwoThree'
import sinon from 'sinon';

describe('entity attribute test', function () {
	it('should return entity from storage', async () => {
		const entity = new User();
		entity.getAttribute('company').setStorageValue('A');
		assert.equal(entity.getAttribute('company').value.getCurrent(), 'A');

		sinon.stub(entity.getDriver(), 'findById').callsFake(() => {
			return new QueryResult({id: 'A', name: 'TestCompany'});
		});

		const company = await entity.company;
		entity.getDriver().findById.restore();

		assert.instanceOf(company, Company);
		entity.company.name = 'TestCompany';
	});

	it('should return correct storage value', async () => {
		const entity = new User();

		entity.getAttribute('company').setStorageValue(1);
		assert.equal(await entity.getAttribute('company').getStorageValue(), 1);

		const findById = sinon.stub(entity.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 1, name: 'TestCompany'});
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 'B';
				return new QueryResult();
			});

		entity.company = {id: 5, name: 'Test-1'};
		assert.equal(await entity.getAttribute('company').getStorageValue(), 5);

		entity.company = null;
		assert.equal(await entity.getAttribute('company').getStorageValue(), null);

		findById.restore();
	});

	it('it should auto save linked entity only if it is enabled', async () => {
		const user = new User();

		let save = sinon.stub(user.getDriver(), 'save').callsFake(entity => {
			entity.id = 'A';
			return new QueryResult();
		});

		user.populate({
			firstName: 'John',
			lastName: 'Doe',
			company: {
				name: 'Company',
				image: {
					size: 123.45,
					filename: 'test.jpg'
				}
			}
		});

		user.getAttribute('company').setAutoSave(false);
		user.getAttribute('company').value.getCurrent().getAttribute('image').setAutoSave(false);

		await user.save();

		save.restore();

		assert(save.calledOnce);
		assert.equal(user.id, 'A');

		user.getAttribute('company').setAutoSave();

		// This time we should have an update on User entity, and insert on linked company entity
		save = sinon.stub(user.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'B';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult();
			});

		await user.save();

		save.restore();

		assert(save.calledTwice);
		assert.equal(user.id, 'A');
		assert.equal(await user.get('company.id'), 'B');

		// Finally, let's put auto save on image entity too.

		user.getAttribute('company').value.getCurrent().getAttribute('image').setAutoSave();

		// This time we should have an update on User entity, update on company entity and insert on linked image entity.
		// Additionally, image entity has a createdBy attribute, but since it's empty, nothing must happen here.

		save = sinon.stub(user.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'C';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(() => {
				return new QueryResult();
			});

		try {
			await user.save();
		} catch (e) {
			const bbb = 123;
		}
		save.restore();

		assert(save.calledThrice);
		assert.equal(user.id, 'A');
		assert.equal(await user.get('company.id'), 'B');
		assert.equal(await user.get('company.image.id'), 'C');
	});

	it('auto save must be automatically enabled', async () => {
		const user = new User();
		user.populate({
			firstName: 'John',
			lastName: 'Doe',
			company: {
				name: 'Company',
				image: {
					size: 123.45,
					filename: 'test.jpg'
				}
			}
		});

		let save = sinon.stub(user.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'C';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 'B';
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(entity => {
				entity.id = 'A';
				return new QueryResult();
			});

		await user.save();
		save.restore();

		assert(save.calledThrice);
		assert.equal(user.id, 'A');
		assert.equal(await user.get('company.id'), 'B');
		assert.equal(await user.get('company.image.id'), 'C');
	});

	it('should not trigger saving of same entity (that might be also linked in an another linked entity) twice in one save process', async () => {
		const user = new User();
		user.populate({
			firstName: 'John',
			lastName: 'Doe',
			company: {
				name: 'Company',
				image: {
					size: 123.45,
					filename: 'test.jpg',
					createdBy: user
				}
			}
		});
		await user.save();

		let save = sinon.stub(user.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'C';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 'B';
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(entity => {
				entity.id = 'A';
				return new QueryResult();
			});

		await user.save();
		save.restore();

		assert(save.calledThrice);
		assert.equal(user.id, 'A');

		const company = await user.company;
		assert.equal(company.id, 'B');
		assert.equal((await company.image).id, 'C');
	});

	it('should not trigger save on linked entity since it was not loaded', async () => {
		const findById = sinon.stub(One.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 'one', name: 'One', two: 'two'});
			});

		const one = await One.findById('one');
		findById.restore();

		const save = sinon.stub(one.getDriver(), 'save')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult();
			});

		await one.save();
		save.restore();

		assert(save.calledOnce);
	});

	it('should create new entity and save links correctly', async () => {
		const findById = sinon.stub(One.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 'one', name: 'One'});
			});

		const one = await One.findById('one');
		findById.restore();

		one.two = {name: 'two', three: {name: 'three'}};

		const save = sinon.stub(one.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'three';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 'two';
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(() => {
				return new QueryResult();
			});

		await one.save();
		save.restore();

		assert(save.calledThrice);

		assert.equal(one.id, 'one');

		const two = await one.two;
		assert.equal(two.id, 'two');

		const three = await two.three;
		assert.equal(three.id, 'three');

		assert.equal(await one.getAttribute('two').getStorageValue(), 'two');
		assert.equal(await two.getAttribute('three').getStorageValue(), 'three');
	});

});