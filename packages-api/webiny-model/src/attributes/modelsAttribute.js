// @flow
import Attribute from "./../attribute";
import _ from "lodash";
import Model from "./../model";
import ModelError from "./../modelError";
import { AttributesContainer } from "../index";

class ModelsAttribute extends Attribute {
    modelClass: Class<Model>;

    constructor(name: string, attributesContainer: AttributesContainer, model: Class<Model>) {
        super(name, attributesContainer);

        this.value.setCurrent([]);
        this.modelClass = model;
    }

    getModelClass(): Class<Model> {
        return this.modelClass;
    }

    setValue(values: Array<Model>) {
        if (!this.canSetValue()) {
            return;
        }

        this.value.set = true;

        // Even if the value is invalid (eg. a string), we allow it here, but calling validate() will fail.
        if (!(values instanceof Array)) {
            this.value.setCurrent(values);
            return;
        }

        let newValues = [];
        for (let i = 0; i < values.length; i++) {
            if (_.isPlainObject(values[i])) {
                const newValue = new this.modelClass();
                newValue.populate(_.clone(values[i]));
                newValues.push(newValue);
            } else {
                newValues.push(values[i]);
            }
        }
        this.value.setCurrent(newValues);
    }

    async validate(): Promise<void> {
        if (!this.isSet()) {
            return;
        }

        const attrValue = this.value.getCurrent();
        if (!(attrValue instanceof Array)) {
            this.expected("array", typeof this.value.getCurrent());
        }

        const errors = [];
        const currentValue = ((attrValue: any): Array<Model>);

        for (let i = 0; i < currentValue.length; i++) {
            if (!(currentValue[i] instanceof this.getModelClass())) {
                errors.push({
                    type: ModelError.INVALID_ATTRIBUTE,
                    data: {
                        index: i
                    },
                    message: `Validation failed, item at index ${i} not an instance of Model class.`
                });
                continue;
            }
            try {
                await currentValue[i].validate();
            } catch (e) {
                errors.push({
                    type: e.type,
                    data: { index: i, ...e.data },
                    message: e.message
                });
            }
        }

        if (!_.isEmpty(errors)) {
            throw new ModelError("Validation failed.", ModelError.INVALID_ATTRIBUTE, {
                items: errors
            });
        }
    }

    getValue(): Array<Model> | null {
        return (super.getValue(): any);
    }

    async getJSONValue(): Promise<Array<Object>> {
        if (this.isEmpty()) {
            return [];
        }

        const json = [];
        const value = this.getValue();
        if (value instanceof Array) {
            for (let i = 0; i < value.length; i++) {
                json.push(await value[i].toJSON());
            }
        }

        return json;
    }

    async getStorageValue(): Promise<Array<Object>> {
        if (this.isEmpty()) {
            return [];
        }

        const json = [];
        const value = this.getValue();
        if (value instanceof Array) {
            for (let i = 0; i < value.length; i++) {
                json.push(await value[i].toStorage());
            }
        }

        return json;
    }
}

export default ModelsAttribute;
