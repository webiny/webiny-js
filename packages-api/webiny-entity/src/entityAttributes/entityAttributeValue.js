const {AttributeValue} = require('webiny-model');
const _ = require('lodash');

class EntityAttributeValue extends AttributeValue {
	/**
	 * Value cannot be set as clean if there is no ID present.
	 * @returns {EntityAttributeValue}
	 */
	clean() {
		if (_.get(this.value, 'current.id')) {
			return super.clean();
		}

		return this;
	}
}

module.exports = EntityAttributeValue;