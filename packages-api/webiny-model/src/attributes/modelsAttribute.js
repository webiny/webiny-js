const Attribute = require('./../attribute');
const _ = require('lodash');
const ModelError = require('./../modelError');

class ModelsAttribute extends Attribute {
	constructor(name, attributesContainer, model) {
		super(name, attributesContainer);
		this.modelClass = model;
	}

	getModelClass() {
		return this.modelClass;
	}

	setValue(values = []) {
		if (!this.canSetValue()) {
			return this;
		}

		this.value.set = true;

		// Even if the value is invalid (eg. a string), we allow it here, but calling validate() will fail.
		if (!_.isArray(values)) {
			this.value.setCurrent(values);
			return this;
		}

		let newValues = [];
		for (let i = 0; i < values.length; i++) {
			if (_.isPlainObject(values[i])) {
				const newValue = new this.modelClass();
				newValue.populate(_.clone(values[i]));
				newValues.push(newValue);
			} else {
				newValues.push(values[i]);
			}
		}
		this.value.setCurrent(newValues);

		return this;
	}

	async validate() {
		if (!this.isSet()) {
			return;
		}

		if (!_.isArray(this.value.getCurrent())) {
			this.expected('array', typeof this.value.getCurrent());
		}

		const errors = [];
		for (let i = 0; i < this.value.getCurrent().length; i++) {
			if (!this.value.getCurrent()[i] instanceof this.getModelClass()) {
				errors.push({
					type: ModelError.INVALID_ATTRIBUTE,
					data: {
						index: i
					},
					message: `Validation failed, item at index ${i} not an instance of Model class.`
				});
				continue;
			}
			try {
				await this.value.getCurrent()[i].validate();
			} catch (e) {
				errors.push({
					type: e.getType(),
					data: {index: i, ...e.getData()},
					message: e.getMessage()
				});
			}
		}

		if (!_.isEmpty(errors)) {
			throw new ModelError('Validation failed.', ModelError.INVALID_ATTRIBUTE, {items: errors});
		}
	}

	async getJSONValue() {
		if (this.isEmpty()) {
			return null;
		}

		const json = [];
		for (let i = 0; i < this.getValue().length; i++) {
			const item = this.getValue()[i];
			json.push(await item.toJSON());
		}
		return json;
	}

	async getStorageValue() {
		return this.getJSONValue();
	}
}

module.exports = ModelsAttribute;