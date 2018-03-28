"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyValidation = require("webiny-validation");

var _modelError = require("./modelError");

var _modelError2 = _interopRequireDefault(_modelError);

var _attributeValue = require("./attributeValue");

var _attributeValue2 = _interopRequireDefault(_attributeValue);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

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
         */
        this.value = new (this.getAttributeValueClass())(this);

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
         * If true - populate will skip this attribute
         * @var bool
         */
        this.skipOnPopulate = false;

        /**
         * Determines if attribute is asynchronous or not.
         * @var bool
         */
        this.async = false;

        /**
         * Default value.
         * @var null
         */
        this.defaultValue = null;

        /**
         * Attribute validators.
         * @var string
         */
        this.validators = null;

        /**
         * Custom onSet callback.
         */
        this.onSetCallback = value => value;

        /**
         * Custom onGet callback.
         */
        this.onGetCallback = value => value;

        /**
         * Custom onGetJSONValue callback.
         */
        this.onGetJSONValueCallback = value => value;
    }

    /**
     * Returns AttributeValue class to be used on construct.
     * @returns {AttributeValue}
     */
    getAttributeValueClass() {
        return _attributeValue2.default;
    }

    /**
     * Returns name of attribute
     */
    getName() {
        return this.name;
    }

    /**
     * Sets this attribute as async.
     * @param flag
     * @returns {Attribute}
     */
    setAsync(flag = true) {
        this.async = flag;
        return this;
    }

    /**
     * Returns whether or not this attribute is an async attribute.
     */
    getAsync() {
        return this.async;
    }

    /**
     * Returns parent model attributes container
     */

    getParentAttributesContainer() {
        return this.attributesContainer;
    }

    /**
     * Returns model
     */
    getParentModel() {
        return this.getParentAttributesContainer().getParentModel();
    }

    /**
     * Sets data validators, can be a string containing all validators or a callback that throws a ModelError.
     * @param validators
     * @returns {Attribute}
     */
    setValidators(validators = "") {
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
     * Returns true if attribute has one or more validators set.
     * @returns {boolean}
     */
    hasValidators() {
        return !_lodash2.default.isEmpty(this.validators);
    }

    getValidationValue() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            return _this.getValue();
        })();
    }

    /**
     * Perform validation against currently assigned value.
     * @throws AttributeValidationException
     */
    validate() {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const value = yield _this2.getValidationValue();
            const valueValidation = _this2.isSet() && !Attribute.isEmptyValue(value);

            valueValidation && (yield _this2.validateType(value));
            yield _this2.validateAttribute(value);
            valueValidation && (yield _this2.validateValue(value));
        })();
    }

    /**
     * Only used for validating data type only (eg. string must not be send to an attribute that accepts numbers).
     * Will be triggered before data validation by given validators.
     */
    // eslint-disable-next-line
    validateType(value) {
        return (0, _asyncToGenerator3.default)(function*() {})();
    }
    // Does nothing unless this class is extended and method overridden.
    // Throw an error to signal that validation has failed.

    /**
     * Used to additionally check set data (eg. items in array or to additionally validate set value).
     * Will be triggered after data validation by given validators.
     * @returns {Promise<void>}
     */
    // eslint-disable-next-line
    validateValue(value) {
        return (0, _asyncToGenerator3.default)(function*() {})();
    }
    // Does nothing unless this class is extended and method overridden.
    // Throw an error to signal that validation has failed.

    /**
     * Used to additionally check set data (eg. items in array or to additionally validate set value).
     * Will be triggered after data validation by given validators.
     * @returns {Promise<void>}
     */
    validateAttribute(value) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            let validators = _this3.getValidators();
            if (typeof validators === "string") {
                try {
                    yield _webinyValidation.validation.validate(value, validators);
                } catch (e) {
                    throw new _modelError2.default(
                        "Invalid attribute.",
                        _modelError2.default.INVALID_ATTRIBUTE,
                        {
                            message: e.message,
                            value: e.value,
                            validator: e.validator
                        }
                    );
                }
            } else if (typeof validators === "function") {
                yield validators(value, _this3);
            }
        })();
    }

    /**
     * Resets attribute - empties value and resets value.set flag, which means setting value will again work in cases setOnce is present.
     */
    reset() {
        this.value.reset();
        return this;
    }

    /**
     * Sets skip on populate - if true, value won't be set into attribute when populate method on parent model instance is called.
     */
    setSkipOnPopulate(flag = true) {
        this.skipOnPopulate = flag;
        return this;
    }

    /**
     * Returns true if this attribute will be skipped on populate.
     */
    getSkipOnPopulate() {
        return this.skipOnPopulate;
    }

    /**
     * Checks if given value is empty or not.
     * @param value
     * @returns {boolean}
     */
    static isEmptyValue(value) {
        return value === null || typeof value === "undefined";
    }

    /**
     * Tells us if the value has been set (flag triggered when setValue is called).
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
     * Some attributes may require async behaviour, that is why we annotate both sync and async return values.
     *
     * @param {any} value A value can be anything, depending on the attribute implementation.
     * @returns {void|Promise<void>}
     */
    setValue(value) {
        if (!this.canSetValue()) {
            return;
        }

        this.value.setCurrent(this.onSetCallback(value));
    }

    /**
     * Returns attribute's value.
     * @returns {*}
     */
    getValue() {
        const value = this.value.getCurrent();
        if (Attribute.isEmptyValue(value)) {
            this.value.setCurrent(this.getDefaultValue());
        }

        return this.onGetCallback(this.value.getCurrent(), ...arguments);
    }

    onSet(callback) {
        this.onSetCallback = callback;
        return this;
    }

    onGet(callback) {
        this.onGetCallback = callback;
        return this;
    }

    onGetJSONValue(callback) {
        this.onGetJSONValueCallback = callback;
        return this;
    }

    getJSONValue() {
        var _this4 = this,
            _arguments = arguments;

        return (0, _asyncToGenerator3.default)(function*() {
            return _this4.onGetJSONValueCallback(
                yield _this4.getValue(..._arguments),
                ..._arguments
            );
        })();
    }

    setToStorage(flag = true) {
        this.toStorage = flag;
        return this;
    }

    getToStorage() {
        return this.toStorage;
    }

    getStorageValue() {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            return _this5.getValue();
        })();
    }

    setStorageValue(value) {
        // We don't want to mark value as dirty.
        this.value.setCurrent(value, { skipDifferenceCheck: true });
        return this;
    }

    /**
     * Sets default attribute value.
     */
    setDefaultValue(defaultValue) {
        this.defaultValue = defaultValue;
        return this;
    }

    /**
     * Returns default attribute value.
     */
    getDefaultValue() {
        let defaultValue = this.defaultValue;
        return typeof defaultValue === "function" ? defaultValue() : defaultValue;
    }

    /**
     * If set to true, attribute's value won't be overridden if new values are about to be set.
     */
    setOnce(flag = true) {
        this.once = flag;
        return this;
    }

    /**
     * Tells us if attribute value can only be set once.
     */
    getOnce() {
        return this.once;
    }

    expected(expecting, got) {
        throw new _modelError2.default(
            `Validation failed, received ${got}, expecting ${expecting}.`,
            _modelError2.default.INVALID_ATTRIBUTE
        );
    }
}

exports.default = Attribute;
//# sourceMappingURL=attribute.js.map
