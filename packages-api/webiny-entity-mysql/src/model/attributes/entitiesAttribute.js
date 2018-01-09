const {attributes} = require('webiny-entity');

class EntitiesAttribute extends attributes.entities {
	async getStorageValue() {
		if (this.isEmpty()) {
			return null;
		}

		return JSON.stringify(await attributes.entities.prototype.getStorageValue.call(this));
	}

	setStorageValue(value) {
		this.setValue(JSON.parse(value));
		return this;
	}

}

module.exports = EntitiesAttribute;