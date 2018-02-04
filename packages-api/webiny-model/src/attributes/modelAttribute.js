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

        // This has to be set - it enables setting nested values, even if the current value of the attribute is null.
        // Eg. user.company.image - this will automatically set empty models as values, and enable setting nested values.
        this.defaultValue = () => new this.modelClass();
    }

    getModelClass(): Class<Model> {
        return this.modelClass;
    }

    setValue(value: mixed) {
        if (!this.canSetValue()) {
            return;
        }

        let newValue = null;
        if (value instanceof Model) {
            newValue = value;
        } else if (_.isObject(value)) {
            newValue = new this.modelClass();
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
        const value = this.getValue();
        if (value instanceof Model) {
            return await value.toStorage();
        }
        return value;
    }

    setStorageValue(value: mixed): this {
        if (value) {
            // We don't want to mark value as dirty.
            const newValue = new this.modelClass();
            newValue.populate(value);
            this.value.setCurrent(newValue, { skipDifferenceCheck: true });
        }
        return this;
    }

    /**
     * If value is assigned (checked in the parent validate call), it must by an instance of Model.
     */
    validateType() {
        if (this.value.getCurrent() instanceof this.getModelClass()) {
            return;
        }
        this.expected("instance of Model class", typeof this.value.getCurrent());
    }

    async validate(): Promise<void> {
        // This validates on the attribute level.
        await Attribute.prototype.validate.call(this);

        // This validates on the model level.
        const currentValue = this.value.getCurrent();
        if (currentValue instanceof this.getModelClass()) {
            await currentValue.validate();
        }
    }
}

export default ModelAttribute;
