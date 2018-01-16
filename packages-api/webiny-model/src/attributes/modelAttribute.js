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

		this.value.setCurrent(newValue);

		return this;
	}

	async getJSONValue() {
		if (this.isEmpty()) {
			return null;
		}

		return this.getValue().toJSON();
	}

	async getStorageValue() {
		return this.getJSONValue();
	}

	/**
	 * If value is assigned (checked in the parent validate call), it must by an instance of Model.
	 */
	validateType() {
		if (this.value.getCurrent() instanceof this.getModelClass()) {
			return;
		}
		this.expected('instance of Model class', typeof this.value.getCurrent());
	}

	async validate() {
		// This validates on the attribute level.
		await Attribute.prototype.validate.call(this);

		// This validates on the model level.
		this.value.getCurrent() instanceof this.getModelClass() && await this.value.getCurrent().validate();
	}
}

module.exports = ModelAttribute;