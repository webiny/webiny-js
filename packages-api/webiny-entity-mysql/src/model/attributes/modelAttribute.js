const {attributes} = require('webiny-model');

class ModelAttribute extends attributes.model {
	setStorageValue(value) {
        this.setValue(JSON.parse(value));
        return this;
    }

    async getStorageValue() {
		if (this.isEmpty()) {
			return null;
		}
		return JSON.stringify(await attributes.model.prototype.getStorageValue.call(this));
	}
}

module.exports = ModelAttribute;