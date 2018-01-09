const {Model} = require('webiny-model');
const EntityAttributesContainer = require('./entityAttributesContainer');

class EntityModel extends Model {
	constructor() {
		super();
		this.parentEntity = null;
	}

	setParentEntity(parentEntity) {
		this.parentEntity = parentEntity;
		return this;
	}

	getParentEntity() {
		return this.parentEntity;
	}

	getAttributesContainerInstance() {
		return new EntityAttributesContainer(this);
	}
}

module.exports = EntityModel;