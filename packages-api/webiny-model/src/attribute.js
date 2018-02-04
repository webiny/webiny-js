// @flow
import _ from "lodash";
import { validation } from "webiny-validation";
import ModelError from "./modelError";
import AttributeValue from "./attributeValue";

import type {
    IAttribute,
    AttributeValueCallback,
    IAttributesContainer,
    IModel,
    AttributeValidator
} from "./../flow-typed";

class Attribute implements IAttribute {
    name: string;
    attributesContainer: IAttributesContainer;
    value: AttributeValue;
    once: boolean;
    toStorage: boolean;
    toJSON: boolean;
    skipOnPopulate: boolean;
    defaultValue: mixed;
    validators: string | AttributeValidator;
    onSetCallback: AttributeValueCallback;
    onGetCallback: AttributeValueCallback;

    constructor(name: string, attributesContainer: IAttributesContainer) {
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
        this.value = new AttributeValue((this: Attribute));

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
         * @var string
         */
        this.validators = "";

        /**
         * Custom onSet callback
         */
        this.onSetCallback = value => value;

        /**
         * Custom onGet callback
         */
        this.onGetCallback = value => value;
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

    getParentAttributesContainer(): IAttributesContainer {
        return this.attributesContainer;
    }

    /**
     * Returns model
     */
    getParentModel(): IModel {
        return this.getParentAttributesContainer().getParentModel();
    }

    /**
     * Sets data validators, can be a string containing all validators or a callback that throws a ModelError.
     * @param validators
     * @returns {Attribute}
     */
    setValidators(validators: string | Function = ""): IAttribute {
        this.validators = validators;
        return this;
    }

    /**
     * Returns defined validators or validation callback.
     * @returns {array}
     */
    getValidators(): string | AttributeValidator {
        return this.validators;
    }

    /**
     * Returns true if attribute has one or more validators set.
     * @returns {boolean}
     */
    hasValidators(): boolean {
        return !_.isEmpty(this.validators);
    }

    /**
     * Resets attribute - empties value and resets value.set flag, which means setting value will again work in cases setOnce is present.
     */
    reset(): IAttribute {
        this.value.reset();
        return this;
    }

    /**
     * Sets skip on populate - if true, value won't be set into attribute when populate method on parent model instance is called.
     */
    setSkipOnPopulate(flag: boolean = true): IAttribute {
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
     * Only used for validating data type only (eg. string must not be send to an attribute that accepts numbers).
     * Will be triggered before data validation by given validators.
     */
    validateType() {
        // Does nothing unless this class is extended and method overridden
        // Throw an error to signal that validation has failed
    }

    /**
     * Perform validation against currently assigned value.
     * @throws AttributeValidationException
     */
    async validate(): Promise<void> {
        this.isSet() && this.hasValue() && this.validateType();

        let validators = this.getValidators();
        if (_.isString(validators)) {
            try {
                return await validation.validate(this.value.getCurrent(), validators);
            } catch (e) {
                throw new ModelError("Invalid attribute.", ModelError.INVALID_ATTRIBUTE, {
                    message: e.message,
                    value: e.value,
                    validator: e.validator
                });
            }
        } else if (typeof validators === "function") {
            return validators(this.value.getCurrent(), this);
        }
    }

    /**
     * Tells us if current attribute has an assigned value.
     */
    hasValue(): boolean {
        return this.value.getCurrent() !== null && this.value.getCurrent() !== undefined;
    }

    /**
     * Opposite of `hasValue()`
     */
    isEmpty(): boolean {
        return !this.hasValue();
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
    setValue(value: any): void | Promise<void> {
        if (!this.canSetValue()) {
            return;
        }

        this.value.setCurrent(this.onSetCallback(value));
    }

    /**
     * Returns attribute's value.
     */
    getValue(): mixed {
        if (this.isEmpty()) {
            this.value.setCurrent(this.getDefaultValue());
        }

        return this.onGetCallback(this.value.getCurrent());
    }

    onSet(callback: AttributeValueCallback) {
        this.onSetCallback = callback;
        return this;
    }

    onGet(callback: AttributeValueCallback) {
        this.onGetCallback = callback;
        return this;
    }

    async getJSONValue(): Promise<mixed> {
        return this.getValue();
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

    setStorageValue(value: mixed): this {
        // We don't want to mark value as dirty.
        this.value.setCurrent(value, { skipDifferenceCheck: true });
        return this;
    }

    /**
     * Sets default attribute value.
     */
    setDefaultValue(defaultValue: mixed = null): this {
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
