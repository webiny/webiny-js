import {assert} from 'chai';

import SimpleEntity from './entities/simpleEntity'

describe('table name test', function () {
	it('it should return classId as table name', async () => {
		assert.equal(SimpleEntity.getDriver().getTableName(SimpleEntity), 'SimpleEntity');

		const entity = new SimpleEntity();
		assert.equal(entity.getDriver().getTableName(entity), 'SimpleEntity');
	});

	it('it should return tableName, defined on the class', async () => {
		class CustomTableEntity extends SimpleEntity {
		}

		CustomTableEntity.tableName = 'SuperCustom';
		const entity = new CustomTableEntity();

		assert.equal(CustomTableEntity.getDriver().getTableName(CustomTableEntity), 'SuperCustom');
		assert.equal(entity.getDriver().getTableName(entity), 'SuperCustom');
	});

	it('it should prepend prefix', async () => {
		SimpleEntity.getDriver().setTablePrefix('webiny_');
		const entity = new SimpleEntity();

		assert.equal(SimpleEntity.getDriver().getTableName(SimpleEntity), 'webiny_SimpleEntity');
		assert.equal(entity.getDriver().getTableName(entity), 'webiny_SimpleEntity');
	});

	it('it should apply table name naming function', async () => {
		SimpleEntity.tableName = 'SuperCustom';
		SimpleEntity
			.getDriver()
			.setTablePrefix('webiny_webiny_')
			.setTableNaming(({classId, tableName, driver}) => {
				return driver.getTablePrefix() + classId + tableName;
			});


		const entity = new SimpleEntity();
		assert.isFunction(SimpleEntity.getDriver().getTableNaming());
		assert.equal(SimpleEntity.getDriver().getTableName(SimpleEntity), 'webiny_webiny_SimpleEntitySuperCustom');
		assert.equal(entity.getDriver().getTableName(entity), 'webiny_webiny_SimpleEntitySuperCustom');
	});
});