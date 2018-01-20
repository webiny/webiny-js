import _ from 'lodash';
import extractor from 'webiny-data-extractor';
import DefaultAttributesContainer from './defaultAttributesContainer'
import ModelError from './modelError'

class Model {
	constructor(definition) {
		this.attributes = {};
		this.validating = false;

		this.attributesContainer = this.getAttributesContainerInstance();

		if (_.isFunction(definition)) {
			definition.call(this)
		}

		return new Proxy(this, {
			set: (instance, key, value) => {
				const attr = instance.getAttribute(key);
				if (attr) {
					attr.setValue(value);
					return true;
				}

				instance[key] = value;
				return true;
			},
			get: (instance, key) => {
				const attr = instance.getAttribute(key);
				if (attr) {
					return attr.getValue();
				}

				return instance[key];
			}
		});
	}

	attr(attribute) {
		return this.getAttributesContainer().attr(attribute);
	}

	getAttributesContainerInstance() {
		return new DefaultAttributesContainer(this);
	}

	getAttributesContainer() {
		return this.attributesContainer;
	}

	getAttribute(attribute) {
		if (_.has(this.attributes, attribute)) {
			return this.attributes[attribute];
		}
		return undefined;
	}

	setAttribute(name, attribute) {
		this.attributes[name] = attribute;
		return this;
	}

	getAttributes() {
		return this.attributes;
	}

	clean() {
		for (const [name, attribute] of Object.entries(this.getAttributes())) {
			attribute.value.clean();
		}
	}

	isDirty() {
		for (const [name, attribute] of Object.entries(this.getAttributes())) {
			if (attribute.value.isDirty()) {
				return true;
			}
		}
		return false;
	}

	isClean() {
		return !this.isDirty();
	}

	/**
	 * Populates the model with given data.
	 * @param data
	 * @returns {Model}
	 */
	populate(data) {
		if (!_.isObject(data)) {
			throw new ModelError('Populate failed - received data not an object.', ModelError.POPULATE_FAILED_NOT_OBJECT);
		}

		for (const [name, attribute] of Object.entries(this.getAttributes())) {
			if (attribute.getSkipOnPopulate()) {
				continue;
			}

			if (_.has(data, name)) {
				attribute.setValue(data[name]);
			}
		}

		return this;
	}

	/**
	 * Validates values of all attributes.
	 * @returns {Promise.<void>}
	 */
	async validate() {
		if (this.validating) {
			return;
		}
		this.validating = true;

		const invalidAttributes = {};
		for (const [name, attribute] of Object.entries(this.getAttributes())) {
			try {
				await attribute.validate();
			} catch (e) {
				invalidAttributes[attribute.getName()] = {
					type: e.getType(),
					data: e.getData(),
					message: e.getMessage()
				};
			}
		}

		this.validating = false;

		if (!_.isEmpty(invalidAttributes)) {
			throw new ModelError('Validation failed.', ModelError.INVALID_ATTRIBUTES, {invalidAttributes});
		}
	}

	async toJSON(path = null) {
		const json = {};
		for (const [name, attribute] of Object.entries(this.getAttributes())) {
			json[name] = await attribute.getJSONValue();
		}

		return path ? await extractor.get(json, path) : json;
	}

	async get(path = '', defaultValue) {
		const steps = _.isArray(path) ? path : path.split('.');
		let value = this;
		for (let i = 0; i < steps.length; i++) {
			if (!_.isObject(value)) {
				break;
			}

			value = await value[steps[i]];
		}

		return typeof(value) === 'undefined' ? defaultValue : value;
	}

	async set(path, value) {
		const steps = path.split('.');
		const lastStep = steps.pop();

		const model = await this.get(steps);
		return model.getAttribute(lastStep).setValue(value);
	}

	/**
	 * Returns data that is suitable for latter saving in a storage layer (database, caching etc.). This is useful because attributes can
	 * have different values here (eg. only ID sometimes is needed) and also some attributes don't even need to be saved in the storage,
	 * which is most often the case with dynamic attributes.
	 * @returns {Promise.<{}>}
	 */
	async toStorage() {
		const json = {};
		for (const [name, attribute] of Object.entries(this.getAttributes())) {
			if (attribute.getToStorage()) {
				json[name] = await attribute.getStorageValue();
			}
		}

		return json;
	}

	populateFromStorage(data) {
		if (!_.isObject(data)) {
			throw new ModelError('Populate failed - received data not an object.', ModelError.POPULATE_FAILED_NOT_OBJECT);
		}

		for (const [name, attribute] of Object.entries(this.getAttributes())) {
			_.has(data, name) && attribute.getToStorage() && attribute.setStorageValue(data[name]);
		}

		return this;
	}
}

export default Model;