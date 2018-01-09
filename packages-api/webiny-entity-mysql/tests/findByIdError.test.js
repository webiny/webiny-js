const sinon = require('sinon');
const SimpleEntity = require('./entities/simpleEntity');

describe('findById error test', function () {
    it('findById - should throw an error', async () => {
        sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
			callback(new Error('This is an error.'));
        });

		try {
			await SimpleEntity.findById(123);
		} catch (e) {
			return;
		} finally {
			SimpleEntity.getDriver().getConnection().query.restore();
		}
		throw Error(`Error should've been thrown.`);
    });
});