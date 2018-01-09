const {AttributeValue} = require('webiny-model');

class EntitiesAttributeValue extends AttributeValue {
	/**
	 * Value cannot be set as clean if ID is missing in one of the entities.
	 * @returns {EntityAttributeValue}
	 */
	clean() {
		const entities = this.current || [];
		for (let i = 0; i < entities.length; i++) {
			const {Entity} = require('./..');
			if (entities[i] instanceof Entity) {
				if (!entities[i].id) {
					return this;
				}
			}
		}

		return super.clean();
	}
}

module.exports = EntitiesAttributeValue;