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
        if (value) {
            // We don't want to mark value as dirty.
            const newValue = this.getModelInstance().populateFromStorage(value);
            this.value.setCurrent(newValue, { skipDifferenceCheck: true });
        }
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

    async validateValue(value: mixed): Promise<void> {
        // This validates on the model level.
        if (value instanceof this.getModelClass()) {
            await value.validate();
        }
    }
}

export default ModelAttribute;
