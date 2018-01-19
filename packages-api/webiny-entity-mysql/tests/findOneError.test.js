import sinon from 'sinon';
const SimpleEntity = require('./entities/simpleEntity');

describe('findOne error test', function () {
    it('findOne - should find previously inserted entity', async () => {
        sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
			callback(new Error('This is an error.'));
		});
		sinon.stub(SimpleEntity.getDriver().getConnection(), 'end').callsFake(() => {});

		try {
			await SimpleEntity.findOne({query: {id: 1}});
		} catch (e) {
			return;
		} finally {
			SimpleEntity.getDriver().getConnection().query.restore();
			SimpleEntity.getDriver().getConnection().end.restore();
		}
		throw Error(`Error should've been thrown.`);
    });
});