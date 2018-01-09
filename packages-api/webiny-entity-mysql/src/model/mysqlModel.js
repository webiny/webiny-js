const {EntityModel} = require('webiny-entity');
const AttributesContainer = require('./mysqlAttributesContainer');

class MySQLModel extends EntityModel {
    getAttributesContainerInstance() {
        return new AttributesContainer(this);
    }
}

module.exports = MySQLModel;