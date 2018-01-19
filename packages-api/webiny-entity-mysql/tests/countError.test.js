import sinon from 'sinon';
import SimpleEntity from './entities/simpleEntity'

describe('count error test', function () {
	it('count - an error must be thrown', async () => {
		sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
			callback(new Error('This is an error.'));
		});

		try {
			await SimpleEntity.count();
		} catch (e) {
			return;
		} finally {
			SimpleEntity.getDriver().getConnection().query.restore();
		}
		throw Error(`Error should've been thrown.`);
	});
});