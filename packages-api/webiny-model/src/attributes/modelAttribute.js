const Attribute = require('./../attribute');

class ModelAttribute extends Attribute {
    constructor(name, attributesContainer, model) {
        super(name, attributesContainer);
        this.modelClass = model;
        this.defaultValue = () => new this.modelClass();
    }

    getModelClass() {
        return this.modelClass;
    }

    setValue(value) {
        if (!this.canSetValue()) {
            return this;
        }

        const {Model} = require('./..');

        let newValue = null;
        if (value instanceof Model) {
            newValue = value;
        } else {
            newValue = new this.modelClass();
            newValue.populate(value);
        }

        this.value.current = newValue;

        return this;
    }

    async getJsonValue() {
		if (this.isEmpty()) {
			return null;
		}

        return this.getValue().toJSON();
    }

	async getStorageValue() {
		return this.getJsonValue();
	}

    async validate() {
        if (this.isSet()) {
            if (!(this.value.current instanceof this.getModelClass())) {
                this.expected('instance of Model class', typeof this.value.current);
            }
			await this.value.current.validate();
		}

        return Attribute.prototype.validate.call(this);
    }
}

module.exports = ModelAttribute;