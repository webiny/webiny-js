const {attributes} = require('webiny-model');

class ModelsAttribute extends attributes.models {
	setStorageValue(value) {
		this.setValue(JSON.parse(value));
		return this;
	}

	async getStorageValue() {
		if (this.isEmpty()) {
			return null;
		}

		return JSON.stringify(await attributes.models.prototype.getStorageValue.call(this));
	}
}

module.exports = ModelsAttribute;