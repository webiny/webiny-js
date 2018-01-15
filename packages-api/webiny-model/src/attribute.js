const _ = require('lodash');
const {validation} = require('webiny-validation');
const ModelError = require('./modelError');
const AttributeValue = require('./attributeValue');

class Attribute {
	constructor(name, attributesContainer) {

		/**
		 * Attribute name.
		 */
		this.name = name;

		/**
		 * Attribute's parent model instance.
		 */
		this.attributesContainer = attributesContainer;

		/**
		 * Attribute's current value.
		 * @type {undefined}
		 */
		this.value = new AttributeValue(this);

		/**
		 * If true - updating will be disabled.
		 * @var bool
		 */
		this.once = false;

		/**
		 * Marks whether or not this attribute can be stored in a storage.
		 * @var bool
		 */
		this.toStorage = true;

		/**
		 * If true - mass populate will skip this attribute
		 * @var bool
		 */
		this.skipOnPopulate = false;

		/**
		 * Default value
		 * @var null
		 */
		this.defaultValue = null;

		/**
		 * Attribute validators
		 * @var array
		 */
		this.validators = [];

		/**
		 * Custom onSet callback
		 * @type {null}
		 */
		this.onSetCallback = null;

		/**
		 * Custom onGet callback
		 * @type {null}
		 */
		this.onGetCallback = null;
	}

	/**
	 * Returns name of attribute.
	 * @returns {*}
	 */
	getName() {
		return this.name;
	}

	/**
	 * Returns parent model attributes container.
	 * @returns {*}
	 */

	getParentAttributesContainer() {
		return this.attributesContainer;
	}

	/**
	 * Returns model.
	 * @returns {*}
	 */
	getParentModel() {
		return this.getParentAttributesContainer().getParentModel();
	}

	/**
	 * Sets data validators, can be string containing all validators or a callback that throws a ModelError.
	 * @param validators
	 * @returns {Attribute}
	 */
	setValidators(validators = '') {
		this.validators = validators;
		return this;
	}

	/**
	 * Returns defined validators or validation callback.
	 * @returns {array}
	 */
	getValidators() {
		return this.validators;
	}

	/**
	 * Resets attribute - empties value and resets value.set flag, which means setting value will again work in cases setOnce is present.
	 * @returns {Attribute}
	 */
	reset() {
		this.value.reset();
		return this;
	}

	/**
	 * Sets skip on populate - if true, value won't be set into attribute when populate method on parent model instance is called.
	 * @param flag
	 * @returns {Attribute}
	 */
	setSkipOnPopulate(flag = true) {
		this.skipOnPopulate = flag;
		return this;
	}

	/**
	 * Returns true if this attribute will be skipped on populate.
	 * @returns {bool}
	 */
	getSkipOnPopulate() {
		return this.skipOnPopulate;
	}

	/**
	 * Only used for validating data type only (eg. string must not be send to an attribute that accepts numbers).
	 * Will be triggered before data validation by given validators.
	 */
	validateType() {
	}

	/**
	 * Perform validation against currently assigned value.
	 * @throws AttributeValidationException
	 */
	async validate() {
		this.isSet() && this.hasValue() && this.validateType();

		let validators = this.getValidators();
		if (_.isString(validators)) {
			try {
				return await validation.validate(this.value.current, validators);
			} catch (e) {
				throw new ModelError('Invalid attribute.', ModelError.INVALID_ATTRIBUTE, {
					message: e.getMessage(),
					value: e.getValue(),
					validator: e.getValidator()
				})
			}
		} else if (_.isFunction(validators)) {
			return await validators(this.value.current, this);
		}
	}

	/**
	 * Tells us if current attribute has an assigned value.
	 * @returns {boolean}
	 */
	hasValue() {
		return this.value.current !== null && this.value.current !== undefined;
	}

	/**
	 *
	 * @returns {boolean}
	 */
	isEmpty() {
		return !this.hasValue();
	}

	/**
	 * Tells us if the value has been set (flag triggered when setValue is called).
	 * @returns {Attribute.value.set}
	 */
	isSet() {
		return this.value.isSet();
	}

	/**
	 * Tells us if value can be set or not (eg. dynamic attributes cannot receive data to be set as an attribute value).
	 * @returns {boolean}
	 */
	canSetValue() {
		return !(this.getOnce() && this.isSet());
	}

	/**
	 * Sets attribute's value.
	 * @param value
	 */
	setValue(value) {
		if (!this.canSetValue()) {
			return;
		}

		if (_.isFunction(this.onSetCallback)) {
			this.value.current = this.onSetCallback(value);
		} else {
			this.value.current = value;
		}
	}

	/**
	 * Returns attribute's value.
	 * @returns {*}
	 */
	getValue() {
		if (this.isEmpty()) {
			this.value.current = this.getDefaultValue();
		}

		if (_.isFunction(this.onGetCallback)) {
			return this.onGetCallback(this.value.current);
		}

		return this.value.current;
	}

	onSet(callback) {
		this.onSetCallback = callback;
		return this;
	}

	onGet(callback) {
		this.onGetCallback = callback;
		return this;
	}

	async getJSONValue() {
		return this.getValue();
	}

	setToStorage(flag = true) {
		this.toStorage = flag;
		return this;
	}

	getToStorage() {
		return this.toStorage;
	}

	async getStorageValue() {
		return this.getValue();
	}

	setStorageValue(value) {
		this.value.current = value;

		// We don't want to mark value as dirty.
		this.value.clean();
		return this;
	}

	/**
	 * Sets default value of attribute.
	 * @param defaultValue
	 * @returns {Attribute}
	 */
	setDefaultValue(defaultValue = null) {
		this.defaultValue = defaultValue;
		return this;
	}

	/**
	 * Returns default value of attribute.
	 * @returns {null}
	 */
	getDefaultValue() {
		let defaultValue = this.defaultValue;
		return _.isFunction(defaultValue) ? defaultValue() : defaultValue;
	}

	/**
	 * If set to true, attribute's value won't be overridden if new values are about to be set.
	 * @param flag
	 * @returns {Attribute}
	 */
	setOnce(flag = true) {
		this.once = flag;
		return this;
	}

	/**
	 * Tells us if attribute value can only be set once.
	 * @returns {bool}
	 */
	getOnce() {
		return this.once;
	}

	expected(expecting, got, returnError = false) {
		const error = new ModelError(`Validation failed, received ${got}, expecting ${expecting}.`, ModelError.INVALID_ATTRIBUTE);
		if (returnError) {
			return error;
		}

		throw error;
	}
}

module.exports = Attribute;