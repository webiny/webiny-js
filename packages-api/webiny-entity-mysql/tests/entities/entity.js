const entity = require('webiny-entity');
const {MySQLDriver} = require('./../../src');
const mysql = require('mysql');

class Entity extends entity.Entity {
}

Entity.driver = new MySQLDriver({
	// Dummy connection - doesn't actually connect.
	connection: mysql.createConnection({})
});

module.exports = Entity;