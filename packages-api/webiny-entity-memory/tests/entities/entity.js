const entity = require('webiny-entity');
const {MemoryDriver} = require('./../../src');

class Entity extends entity.Entity {

}

Entity.driver = new MemoryDriver();

module.exports = Entity;