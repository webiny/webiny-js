// @flow
import Attribute from "./../attribute";
import Model from "./../model";
import { AttributesContainer } from "../index";

class ModelAttribute extends Attribute {
    modelClass: Class<Model>;

    constructor(name: string, attributesContainer: AttributesContainer, model: Class<Model>) {
        super(name, attributesContainer);
        this.modelClass = model;
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
        } else {
            newValue = new this.modelClass();
            newValue.populate(value);
        }

        this.value.setCurrent(newValue);
    }

    async getJSONValue(): Promise<mixed> {
        if (this.isEmpty()) {
            return null;
        }

        const model = this.getValue();
        if (model instanceof Model) {
            return model.toJSON();
        }
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
        const currentValue = this.value.getCurrent();
        if (currentValue instanceof this.getModelClass()) {
            await currentValue.validate();
        }
    }
}

export default ModelAttribute;
