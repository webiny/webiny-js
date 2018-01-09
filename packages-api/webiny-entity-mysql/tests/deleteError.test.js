const sinon = require('sinon');
const SimpleEntity = require('./entities/simpleEntity');

describe('delete error test', function () {
    it('should throw an error', async () => {
        sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
            callback(null, {insertId: 1});
        });

        const simpleEntity = new SimpleEntity();
        simpleEntity.name = 'This is a test';
        await simpleEntity.save();
        SimpleEntity.getDriver().getConnection().query.restore();

        sinon.stub(SimpleEntity.getDriver().getConnection(), 'query').callsFake((query, callback) => {
			callback(new Error('This is an error.'));
		});

		try {
			await simpleEntity.delete();
		} catch (e) {
			return;
		} finally {
			SimpleEntity.getDriver().getConnection().query.restore();
		}
		throw Error(`Error should've been thrown.`);
    });
});