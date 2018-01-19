import {Model} from 'webiny-model'
import EntityAttributesContainer from './entityAttributesContainer'

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

export default EntityModel;