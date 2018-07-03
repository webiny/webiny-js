// @flow
import Attribute from "./../attribute";
import ModelAttributeValue from "./modelAttributeValue";

import Model from "./../model";
import _ from "lodash";
import { AttributesContainer } from "../index";

class ModelAttribute extends Attribute {
    modelClass: Class<Model>;

    constructor(name: string, attributesContainer: AttributesContainer, model: Class<Model>) {
        super(name, attributesContainer);

        // If provided class is not a subclass of Model, we must throw an error.
        const validInstance = model.prototype instanceof Model;
        if (!validInstance) {
            throw Error(
                `"model" attribute "${name}" received an invalid class (subclass of Model is required).`
            );
        }

        this.modelClass = model;
    }

    getModelClass(): Class<Model> {
        return this.modelClass;
    }

    getModelInstance() {
        const modelClass = this.getModelClass();
        return new modelClass();
    }

    setValue(value: mixed) {
        if (!this.canSetValue()) {
            return;
        }

        const finalValue = this.onSetCallback(value);

        let newValue = null;
        if (finalValue instanceof Model) {
            newValue = finalValue;
        } else if (_.isObject(finalValue)) {
            newValue = this.getModelInstance();
            newValue.populate(finalValue);
        } else {
            newValue = finalValue;
        }

        this.value.setCurrent(newValue);
    }

    async getJSONValue(): Promise<mixed> {
        const value = this.getValue();
        if (value instanceof Model) {
            return {};
        }
        return value;
    }

    async getStorageValue(): Promise<mixed> {
        const value = await this.getValue();
        if (value instanceof Model) {
            const json = {};
            for (let name in value.getAttributes()) {
                const attribute = value.getAttribute(name);
                // $FlowFixMe - we can be sure we have attribute because it's pulled from list of attributes, using getAttributes() method.
                if (attribute.getToStorage()) {
                    // $FlowFixMe - we can be sure we have attribute because it's pulled from list of attributes, using getAttributes() method.
                    json[name] = await attribute.getStorageValue();
                }
            }

            return json;
        }
        return value;
    }

    setStorageValue(value: mixed): this {
        const newValue = this.getModelInstance().populateFromStorage(value);
        this.value.setCurrent(newValue, { skipDifferenceCheck: true });
        return this;
    }

    /**
     * If value is assigned (checked in the parent validate call), it must by an instance of Model.
     */
    async validateType(value: mixed) {
        if (value instanceof this.getModelClass()) {
            return;
        }
        this.expected("instance of Model class", typeof value);
    }

    /**
     * We can be sure that value is an instance of Model since otherwise this point would not be reached
     * (because of the validateType method above).
     * @param value
     * @returns {Promise<void>}
     */
    async validateValue(value: mixed): Promise<void> {
        const currentValue = ((value: any): Model);
        await currentValue.validate();
    }

    /**
     * Returns AttributeValue class to be used on construct.
     * @returns {AttributeValue}
     */
    getAttributeValueClass() {
        return ModelAttributeValue;
    }
}

export default ModelAttribute;
