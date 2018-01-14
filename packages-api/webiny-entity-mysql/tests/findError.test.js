const sinon = require('sinon');
const SimpleEntity = require('./entities/simpleEntity');

describe('find error test', function () {
    it('find - an error must be thrown', async () => {
        sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
			callback(new Error('This is an error.'));
		});
		sinon.stub(SimpleEntity.getDriver().getConnection(), 'end').callsFake(() => {});

		try {
			await SimpleEntity.find();
		} catch (e) {
			return;
		} finally {
			SimpleEntity.getDriver().getConnection().query.restore();
			SimpleEntity.getDriver().getConnection().end.restore();
		}
		throw Error(`Error should've been thrown.`);
    });
});