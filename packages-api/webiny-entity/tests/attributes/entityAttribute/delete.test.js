import {assert} from 'chai';

import {QueryResult} from '../../../src/index'
import {User, Company} from '../../entities/userCompanyImage'
import {One} from '../../entities/oneTwoThree'
import {ClassA} from '../../entities/abc'
import sinon from 'sinon';

describe('entity delete test', function () {
	it('auto delete must be manually enabled and canDelete must stop deletion if error was thrown', async () => {
		const user = new User();
		user.populate({
			firstName: 'John',
			lastName: 'Doe',
			markedAsCannotDelete: true,
			company: {
				name: 'Company',
				markedAsCannotDelete: true,
				image: {
					filename: 'test.jpg',
					size: 123.45,
					markedAsCannotDelete: true
				}
			}
		});

		let entitySave = sinon.stub(user.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 55;
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 66;
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(entity => {
				entity.id = 77;
				return new QueryResult();
			});

		await user.save();
		entitySave.restore();

		let error = null;

		let entityDelete = sinon.stub(user.getDriver(), 'delete');
		try {
			await user.delete();
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, Error);
		assert.equal(error.message, 'Cannot delete User entity');
		assert(entityDelete.notCalled);

		user.markedAsCannotDelete = false;
		try {
			await user.delete();
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, Error);
		assert.equal(error.message, 'Cannot delete Company entity');
		assert(entityDelete.notCalled);

		const company = await user.company;
		company.markedAsCannotDelete = false;

		try {
			await user.delete();
		} catch (e) {
			error = e;
		}

		assert.instanceOf(error, Error);
		assert.equal(error.message, 'Cannot delete Image entity');
		assert(entityDelete.notCalled);

		const image = await company.image;
		image.markedAsCannotDelete = false;

		await user.delete();

		entityDelete.restore();
		assert(entityDelete.calledThrice);
	});

	it('should properly delete linked entity even though they are not loaded (auto delete enabled)', async () => {
		let findById = sinon.stub(One.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 'one', name: 'One', two: 'two'});
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult({id: 'two', name: 'Two', three: 'three'});
			})
			.onCall(2)
			.callsFake(() => {
				return new QueryResult({id: 'three', name: 'Three', four: 'four', anotherFour: 'anotherFour', five: 'five', six: 'six'});
			})
			.onCall(3)
			.callsFake(() => {
				return new QueryResult({id: 'four', name: 'Four'});
			})
			.onCall(4)
			.callsFake(() => {
				return new QueryResult({id: 'anotherFour', name: 'Another Four'});
			})
			.onCall(5)
			.callsFake(() => {
				return new QueryResult({id: 'five', name: 'Five'});
			})
			.onCall(6)
			.callsFake(() => {
				return new QueryResult({id: 'six', name: 'Six'});
			});

		const one = await One.findById('one');

		let entityDelete = sinon.stub(one.getDriver(), 'delete');
		await one.delete();

		assert.equal(entityDelete.callCount, 7);

		findById.restore();
		entityDelete.restore();
	});

	it('should not delete linked entities if main entity is deleted and auto delete is not enabled', async () => {
		const entityFindById = sinon.stub(ClassA.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 'classA', name: 'ClassA'});
			});

		const classA = await ClassA.findById('classA');
		entityFindById.restore();

		classA.classB = {name: 'classB', classC: {name: 'classC'}};

		const entitySave = sinon.stub(classA.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'classC';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(entity => {
				entity.id = 'classB';
				return new QueryResult();
			})
			.onCall(2)
			.callsFake(() => {
				return new QueryResult();
			});

		await classA.save();
		entitySave.restore();

		assert(entitySave.calledThrice);

		assert.equal(classA.id, 'classA');

		const classB = await classA.classB;
		assert.equal(classB.id, 'classB');

		const classC = await classB.classC;
		assert.equal(classC.id, 'classC');

		assert.equal(await classA.getAttribute('classB').getStorageValue(), 'classB');
		assert.equal(await classB.getAttribute('classC').getStorageValue(), 'classC');

		const entityDelete = sinon.stub(ClassA.getDriver(), 'delete')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult();
			});

		await classA.delete();
		assert(entityDelete.calledOnce);

		entityDelete.restore();
	});

	it('should delete existing entity once new one was assigned and main entity saved', async () => {
		let entityFindById = sinon.stub(One.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 'one', name: 'One', two: 'two'});
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult({id: 'two', name: 'Two', three: 'three'});
			});

		const one = await One.findById('a');
		assert.equal(await one.getAttribute('two').getStorageValue(), 'two');
		assert.equal(one.getAttribute('two').value.getInitial(), 'two');

		one.two = {
			name: 'Another Two',
			three: {name: 'Another Three', four: {name: 'Another Four'}, anotherFour: {name: 'Another Four x2'}}
		};

		// Since set is async, to test initial / current values, we had to get value of attribute two...
		await one.two;

		assert.equal(entityFindById.callCount, 2);
		entityFindById.restore();

		// ... and now we can be sure the values are set and ready for testing.
		assert.equal(one.getAttribute('two').value.getInitial(), 'two');
		assert.equal(one.getAttribute('two').value.getCurrent().id, null);

		// This is what will happen once we execute save method on One entity

		// 1. recursively call save method on all child entities.
		let entitySave = sinon.stub(One.getDriver(), 'save')
			.onCall(0)
			.callsFake(entity => {
				entity.id = 'anotherFour';
				return new QueryResult();
			})
			.onCall(1)
			.callsFake((entity) => {
				entity.id = 'anotherFourFour';
				return new QueryResult();
			})
			.onCall(2)
			.callsFake((entity) => {
				entity.id = 'anotherThree';
				return new QueryResult();
			})
			.onCall(3)
			.callsFake((entity) => {
				entity.id = 'anotherTwo';
				return new QueryResult();
			})
			.onCall(4)
			.callsFake(() => {
				return new QueryResult();
			});

		// 2. Once the save is done, deletes will start because main entity has a different entity on attribute 'two'. Before deletions,
		// findById method will be executed to recursively load entities and then of course delete them.
		entityFindById = sinon.stub(One.getDriver(), 'findById')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult({id: 'two', name: 'Two', three: 'three'});
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult({id: 'three', name: 'Three'});
			});


		let entityDelete = sinon.stub(One.getDriver(), 'delete')
			.onCall(0)
			.callsFake(() => {
				return new QueryResult();
			})
			.onCall(1)
			.callsFake(() => {
				return new QueryResult();
			});

		await one.save();

		assert.equal(entitySave.callCount, 5);
		assert.equal(entityFindById.callCount, 2);
		assert.equal(entityDelete.callCount, 2);

		entityFindById.restore();
		entityDelete.restore();
		entitySave.restore();
	});
});