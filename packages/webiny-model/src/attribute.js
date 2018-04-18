// @flow
import _ from "lodash";
import { validation } from "webiny-validation";
import ModelError from "./modelError";
import AttributeValue from "./attributeValue";
import type { AttributesContainer, Model } from ".";

class Attribute {
    name: string;
    attributesContainer: AttributesContainer;
    value: AttributeValue;
    once: boolean;
    toStorage: boolean;
    toJSON: boolean;
    async: boolean;
    skipOnPopulate: boolean;
    defaultValue: mixed;
    validators: ?(string | Function);
    onSetCallback: Function;
    onGetCallback: Function;
    onGetJSONValueCallback: Function;
    constructor(name: string, attributesContainer: AttributesContainer) {
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
        return AttributeValue;
    }

    /**
     * Returns name of attribute
     */
    getName(): string {
        return this.name;
    }

    /**
     * Returns parent model attributes container
     */

    getParentAttributesContainer(): AttributesContainer {
        return this.attributesContainer;
    }

    /**
     * Returns model
     */
    getParentModel(): Model {
        return this.getParentAttributesContainer().getParentModel();
    }

    /**
     * Sets data validators, can be a string containing all validators or a callback that throws a ModelError.
     * @param validators
     * @returns {Attribute}
     */
    setValidators(validators: string | Function = ""): Attribute {
        this.validators = validators;
        return this;
    }

    /**
     * Returns defined validators or validation callback.
     * @returns {array}
     */
    getValidators(): ?(string | Function) {
        return this.validators;
    }

    /**
     * Returns true if attribute has one or more validators set.
     * @returns {boolean}
     */
    hasValidators(): boolean {
        return !_.isEmpty(this.validators);
    }

    async getValidationValue() {
        return this.getValue();
    }

    /**
     * Perform validation against currently assigned value.
     * @throws AttributeValidationException
     */
    async validate(): Promise<void> {
        const value = await this.getValidationValue();
        const valueValidation = this.isSet() && !Attribute.isEmptyValue(value);

        valueValidation && (await this.validateType(value));
        await this.validateAttribute(value);
        valueValidation && (await this.validateValue(value));
    }

    /**
     * Only used for validating data type only (eg. string must not be send to an attribute that accepts numbers).
     * Will be triggered before data validation by given validators.
     */
    // eslint-disable-next-line
    async validateType(value: mixed): Promise<void> {
        // Does nothing unless this class is extended and method overridden.
        // Throw an error to signal that validation has failed.
    }

    /**
     * Used to additionally check set data (eg. items in array or to additionally validate set value).
     * Will be triggered after data validation by given validators.
     * @returns {Promise<void>}
     */
    // eslint-disable-next-line
    async validateValue(value: mixed): Promise<void> {
        // Does nothing unless this class is extended and method overridden.
        // Throw an error to signal that validation has failed.
    }

    /**
     * Used to additionally check set data (eg. items in array or to additionally validate set value).
     * Will be triggered after data validation by given validators.
     * @returns {Promise<void>}
     */
    async validateAttribute(value: mixed) {
        let validators = this.getValidators();
        if (typeof validators === "string") {
            try {
                await validation.validate(value, validators);
            } catch (e) {
                throw new ModelError("Invalid attribute.", ModelError.INVALID_ATTRIBUTE, {
                    message: e.message,
                    value: e.value,
                    validator: e.validator
                });
            }
        } else if (typeof validators === "function") {
            await validators(value, this);
        }
    }

    /**
     * Resets attribute - empties value and resets value.set flag, which means setting value will again work in cases setOnce is present.
     */
    reset(): Attribute {
        this.value.reset();
        return this;
    }

    /**
     * Sets skip on populate - if true, value won't be set into attribute when populate method on parent model instance is called.
     */
    setSkipOnPopulate(flag: boolean = true): Attribute {
        this.skipOnPopulate = flag;
        return this;
    }

    /**
     * Returns true if this attribute will be skipped on populate.
     */
    getSkipOnPopulate(): boolean {
        return this.skipOnPopulate;
    }

    /**
     * Checks if given value is empty or not.
     * @param value
     * @returns {boolean}
     */
    static isEmptyValue(value: mixed): boolean {
        return value === null || typeof value === "undefined";
    }

    /**
     * Tells us if the value has been set (flag triggered when setValue is called).
     */
    isSet(): boolean {
        return this.value.isSet();
    }

    /**
     * Tells us if value can be set or not (eg. dynamic attributes cannot receive data to be set as an attribute value).
     * @returns {boolean}
     */
    canSetValue(): boolean {
        return !(this.getOnce() && this.isSet());
    }

    /**
     * Sets attribute's value.
     * Some attributes may require async behaviour, that is why we annotate both sync and async return values.
     *
     * @param {any} value A value can be anything, depending on the attribute implementation.
     * @returns {void|Promise<void>}
     */
    setValue(value: mixed): void {
        if (!this.canSetValue()) {
            return;
        }

        this.value.setCurrent(this.onSetCallback(value));
    }

    /**
     * Returns attribute's value.
     * @returns {*}
     */
    getValue(): mixed | Promise<mixed> {
        const value = this.value.getCurrent();
        if (Attribute.isEmptyValue(value)) {
            this.value.setCurrent(this.getDefaultValue());
        }

        return this.onGetCallback(this.value.getCurrent(), ...arguments);
    }

    onSet(callback: Function) {
        this.onSetCallback = callback;
        return this;
    }

    onGet(callback: Function) {
        this.onGetCallback = callback;
        return this;
    }

    onGetJSONValue(callback: Function) {
        this.onGetJSONValueCallback = callback;
        return this;
    }

    async getJSONValue(): Promise<mixed> {
        return this.onGetJSONValueCallback(await this.getValue(...arguments), ...arguments);
    }

    setToStorage(flag: boolean = true): this {
        this.toStorage = flag;
        return this;
    }

    getToStorage(): boolean {
        return this.toStorage;
    }

    async getStorageValue(): Promise<mixed> {
        return this.getValue();
    }

    setStorageValue(value: mixed): Attribute {
        // We don't want to mark value as dirty.
        this.value.setCurrent(value, { skipDifferenceCheck: true });
        return this;
    }

    /**
     * Sets default attribute value.
     */
    setDefaultValue(defaultValue: ?mixed): this {
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
    setOnce(flag: boolean = true): this {
        this.once = flag;
        return this;
    }

    /**
     * Tells us if attribute value can only be set once.
     */
    getOnce(): boolean {
        return this.once;
    }

    expected(expecting: string, got: string): ModelError {
        throw new ModelError(
            `Validation failed, received ${got}, expecting ${expecting}.`,
            ModelError.INVALID_ATTRIBUTE
        );
    }
}

export default Attribute;
