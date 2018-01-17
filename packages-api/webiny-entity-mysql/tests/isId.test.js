import {assert} from 'chai';

const {Entity} = require('webiny-entity');
const {MySQLDriver} = require('./../src');
const mysql = require('mysql');

class EntityIntegerId extends Entity {
}

EntityIntegerId.driver = new MySQLDriver({
	connection: mysql.createConnection({})
});

class EntityCustomId extends Entity {
}

EntityCustomId.driver = new MySQLDriver({
	connection: mysql.createConnection({}),
	idGenerator: () => {
		return 'randomId'
	}
});


describe('driver override test', function () {
	it('should validate given ID correctly (static call)', async () => {
		assert.isFalse(EntityCustomId.isId(123));
		assert.isTrue(EntityCustomId.isId('asd'));

		assert.isTrue(EntityIntegerId.isId(123));
		assert.isFalse(EntityIntegerId.isId('asd'));
	});

	it('should validate given ID correctly (static call)', async () => {
		const user1 = new EntityCustomId();
		assert.isFalse(user1.isId(123));
		assert.isTrue(user1.isId('asd'));

		const user2 = new EntityIntegerId();
		assert.isTrue(user2.isId(123));
		assert.isFalse(user2.isId('asd'));
	});
});