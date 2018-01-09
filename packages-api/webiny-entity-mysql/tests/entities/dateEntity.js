const Entity = require('./entity');

class DateEntity extends Entity {
	constructor() {
		super();
		this.attr('name').char();
		this.attr('createdOn').date();
	}
}

DateEntity.classId = 'DateEntity';
module.exports = DateEntity;