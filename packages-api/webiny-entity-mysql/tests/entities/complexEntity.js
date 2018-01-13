const {Model} = require('webiny-model');
const Entity = require('./entity');


class VerificationModel extends Model {
	constructor() {
		super();
		this.attr('verified').boolean();
		this.attr('documentType').char().setValidators('in:id:driversLicense');
	}
}

class TagModel extends Model {
	constructor() {
		super();
		this.attr('slug').char();
		this.attr('label').char();
	}
}

class SimpleEntity extends Entity {
	constructor() {
		super();
		this.attr('name').char();
	}
}

SimpleEntity.classId = 'SimpleEntity';

class ComplexEntities2SimpleEntities extends Entity {
	constructor() {
		super();
		this.attr('complexEntity').char();
		this.attr('simpleEntity').char();
	}
}

ComplexEntities2SimpleEntities.classId = 'ComplexEntities2SimpleEntities';

class ComplexEntity extends Entity {
	constructor() {
		super();
		this.attr('firstName').char();
		this.attr('lastName').char();
		this.attr('verification').model(VerificationModel);
		this.attr('tags').models(TagModel);
		this.attr('simpleEntity').entity(SimpleEntity);
		this.attr('simpleEntities').entities(SimpleEntity).setToStorage();
		this.attr('simpleEntitiesLoadedFromTable').entities(SimpleEntity).setAutoSave(false);
		// this.attr('simpleEntitiesUsingAggregationEntity').entities(SimpleEntity).setUsing(ComplexEntities2SimpleEntities);
	}
}

ComplexEntity.classId = 'ComplexEntity';

module.exports = {
	VerificationModel, TagModel, ComplexEntity, SimpleEntity, ComplexEntities2SimpleEntities
};