// @flow
import Attribute from "./../attribute";
import Model from "./../model";
import { AttributesContainer } from "../index";

class ModelAttribute extends Attribute {
    modelClass: Model.constructor;

    constructor(name: string, attributesContainer: AttributesContainer, model: Model.constructor) {
        super(name, attributesContainer);
        this.modelClass = model;
        this.defaultValue = () => new this.modelClass();
    }

    getModelClass(): Model.constructor {
        return this.modelClass;
    }

    setValue(value: any) {
        if (!this.canSetValue()) {
            return;
        }

        let newValue = null;
        if (value instanceof Model) {
            newValue = value;
        } else {
            newValue = new this.modelClass();
            newValue.populate(value);
        }

        this.value.setCurrent(newValue);
    }

    async getJSONValue(): Object {
        if (this.isEmpty()) {
            return null;
        }

        return this.getValue().toJSON();
    }

    async getStorageValue(): Object {
        return this.getJSONValue();
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
        if (this.value.getCurrent() instanceof this.getModelClass()) {
            await this.value.getCurrent().validate();
        }
    }
}

export default ModelAttribute;
