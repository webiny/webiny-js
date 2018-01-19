import _ from 'lodash';
const Entity = require('./entity');

class SimpleEntity extends Entity {
	constructor() {
		super();
		this.attr('name').char();
		this.attr('slug').char();
		this.attr('enabled').boolean().setDefaultValue(true);
		this.on('beforeSave', () => {
			this.slug = _.camelCase(this.name);
		});
	}
}

SimpleEntity.classId = 'SimpleEntity';
module.exports = SimpleEntity;