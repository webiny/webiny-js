import {assert} from 'chai';
import sinon from 'sinon';
import SimpleEntity from './entities/simpleEntity'
import mdbid from 'mdbid';

describe('save error test', function () {
    it('should save new entity but an exception must be thrown', async () => {
        sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
            callback(new Error('This is an error.'));
        });

        const simpleEntity = new SimpleEntity();
        try {
			await simpleEntity.save();
		} catch (e) {
			return;
		} finally {
			SimpleEntity.getDriver().getConnection().query.restore();
		}
		throw Error(`Error should've been thrown.`);
    });

	it('should update existing entity but an exception must be thrown', async () => {
		sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
			callback(null, {insertId: 1});
		});

		const simpleEntity = new SimpleEntity();
		await simpleEntity.save();
		SimpleEntity.getDriver().getConnection().query.restore();

		assert.equal(simpleEntity.id, 1);

		sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
			callback(new Error('This is an error.'));
		});

		try {
			await simpleEntity.save();
		} catch (e) {
			return;
		} finally {
			SimpleEntity.getDriver().getConnection().query.restore();
		}
		throw Error(`Error should've been thrown.`);
	});

	it('should save new entity into database (with hash IDs enabled), but an exception must be thrown', async () => {
		sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
			callback(new Error('This is an error.'));
		});

		SimpleEntity.getDriver().setIdGenerator(() => mdbid());
		const simpleEntity = new SimpleEntity();

		try {
			await simpleEntity.save();
		} catch (e) {
			return;
		} finally {
			SimpleEntity.getDriver().getConnection().query.restore();
		}
		throw Error(`Error should've been thrown.`);

	});
});