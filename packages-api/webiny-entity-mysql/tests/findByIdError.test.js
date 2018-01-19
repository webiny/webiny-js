import sinon from 'sinon';
import SimpleEntity from './entities/simpleEntity'

describe('findById error test', function () {
    it('findById - should throw an error', async () => {
        sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
			callback(new Error('This is an error.'));
        });
		sinon.stub(SimpleEntity.getDriver().getConnection(), 'end').callsFake(() => {});

		try {
			await SimpleEntity.findById(123);
		} catch (e) {
			return;
		} finally {
			SimpleEntity.getDriver().getConnection().query.restore();
			SimpleEntity.getDriver().getConnection().end.restore();
		}
		throw Error(`Error should've been thrown.`);
    });
});