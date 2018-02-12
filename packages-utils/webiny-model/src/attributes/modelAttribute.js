// @flow
import Attribute from "./../attribute";
import Model from "./../model";
import _ from "lodash";
import { AttributesContainer } from "../index";

class ModelAttribute extends Attribute {
    modelClass: Class<Model>;

    constructor(name: string, attributesContainer: AttributesContainer, model: Class<Model>) {
        super(name, attributesContainer);
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

        let newValue = null;
        if (value instanceof Model) {
            newValue = value;
        } else if (_.isObject(value)) {
            newValue = this.getModelInstance();
            newValue.populate(value);
        } else {
            newValue = value;
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
            return await value.toStorage();
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
}

export default ModelAttribute;
