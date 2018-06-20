// @flow
import Attribute from "./../attribute";
import _ from "lodash";
import Model from "./../model";
import ModelError from "./../modelError";
import { AttributesContainer } from "../index";

class ModelsAttribute extends Attribute {
    modelClass: Class<Model>;
    keyValue: boolean;

    constructor(
        name: string,
        attributesContainer: AttributesContainer,
        model: Class<Model>,
        keyValue: boolean = false
    ) {
        super(name, attributesContainer);

        // If provided class is not a subclass of Model, we must throw an error.
        const validInstance = model.prototype instanceof Model;
        if (!validInstance) {
            throw Error(
                `"models" attribute "${name}" received an invalid class (subclass of Model is required).`
            );
        }

        this.modelClass = model;

        this.keyValue = keyValue;
        this.value.current = this.keyValue ? {} : [];
    }

    getModelClass(): Class<Model> {
        return this.modelClass;
    }

    getModelInstance() {
        const modelClass = this.getModelClass();
        return new modelClass();
    }

    setValue(values: mixed) {
        if (!this.canSetValue()) {
            return;
        }

        const finalValues = this.onSetCallback(values);

        if (this.keyValue) {
            // Even if the value is invalid (eg. a string), we allow it here, but calling validate() will fail.
            if (!_.isPlainObject(finalValues)) {
                this.value.setCurrent(finalValues);
                return;
            }

            let newValues = {};
            for (let key in finalValues) {
                if (_.isPlainObject(finalValues[key])) {
                    const newValue = this.getModelInstance();
                    newValue.populate(_.clone(finalValues[key]));
                    newValues[key] = newValue;
                } else {
                    newValues[key] = finalValues[key];
                }
            }
            this.value.setCurrent(newValues);
        } else {
            // Even if the value is invalid (eg. a string), we allow it here, but calling validate() will fail.
            if (!(finalValues instanceof Array)) {
                this.value.setCurrent(finalValues);
                return;
            }

            let newValues = [];
            for (let i = 0; i < finalValues.length; i++) {
                if (_.isPlainObject(finalValues[i])) {
                    const newValue = this.getModelInstance();
                    newValue.populate(_.clone(finalValues[i]));
                    newValues.push(newValue);
                } else {
                    newValues.push(finalValues[i]);
                }
            }
            this.value.setCurrent(newValues);
        }
    }

    async getJSONValue(): Promise<mixed> {
        const value = this.value.getCurrent();
        if (this.keyValue) {
            if (value instanceof Object) {
                return {};
            }

            return value;
        } else {
            if (value instanceof Array) {
                const json = [];
                for (let i = 0; i < value.length; i++) {
                    json.push({});
                }
                return json;
            }

            return value;
        }
    }

    async getStorageValue(): Promise<any> {
        const value = this.getValue();
        if (this.keyValue) {
            if (value instanceof Object) {
                const data = {};
                for (let key in value) {
                    const model = value[key];
                    const json = {};
                    for (let name in model.getAttributes()) {
                        const attribute = model.getAttribute(name);
                        // $FlowIgnore - we can be sure we have attribute because it's pulled from list of attributes, using getAttributes() method.
                        if (attribute.getToStorage()) {
                            // $FlowIgnore - we can be sure we have attribute because it's pulled from list of attributes, using getAttributes() method.
                            json[name] = await attribute.getStorageValue();
                        }
                    }
                    data[key] = json;
                }
                return data;
            }
            return {};
        } else {
            if (value instanceof Array) {
                const data = [];
                for (let i = 0; i < value.length; i++) {
                    const model = value[i];
                    const json = {};
                    for (let name in model.getAttributes()) {
                        const attribute = model.getAttribute(name);
                        // $FlowIgnore - we can be sure we have attribute because it's pulled from list of attributes, using getAttributes() method.
                        if (attribute.getToStorage()) {
                            // $FlowIgnore - we can be sure we have attribute because it's pulled from list of attributes, using getAttributes() method.
                            json[name] = await attribute.getStorageValue();
                        }
                    }
                    data.push(json);
                }
                return data;
            }
            return [];
        }
    }

    setStorageValue(value: mixed): this {
        if (this.keyValue) {
            const newValue = {};
            if (value instanceof Object) {
                for (let key in value) {
                    const item = value[key];
                    newValue[key] = this.getModelInstance().populateFromStorage(item);
                }

                this.value.setCurrent(newValue, { skipDifferenceCheck: true });
            }
        } else {
            const newValue = [];
            if (Array.isArray(value)) {
                value.forEach(item => {
                    newValue.push(this.getModelInstance().populateFromStorage(item));
                });

                this.value.setCurrent(newValue, { skipDifferenceCheck: true });
            }
        }

        return this;
    }

    /**
     * If value is assigned (checked in the parent validate call), it must by an instance of Model.
     */
    async validateType(value: mixed) {
        if (this.keyValue) {
            if (value instanceof Object) {
                return;
            }
            this.expected("object", typeof value);
        } else {
            if (value instanceof Array) {
                return;
            }
            this.expected("array", typeof value);
        }
    }

    async validateValue(value: mixed) {
        if (this.keyValue) {
            const objectValue = ((value: any): Object);
            // This validates on all of the model's levels.
            const errors = [];

            for (let key in objectValue) {
                const current = objectValue[key];
                if (!(current instanceof this.getModelClass())) {
                    errors.push({
                        code: ModelError.INVALID_ATTRIBUTE,
                        data: {
                            index: key
                        },
                        message: `Validation failed, item at index ${key} not an instance of Model class.`
                    });
                    continue;
                }
                try {
                    await current.validate();
                } catch (e) {
                    errors.push({
                        code: e.code,
                        data: { index: key, ...e.data },
                        message: e.message
                    });
                }
            }

            if (!_.isEmpty(errors)) {
                throw new ModelError("Validation failed.", ModelError.INVALID_ATTRIBUTE, errors);
            }
        } else {
            const arrayValue = ((value: any): Array<Model>);
            // This validates on all of the model's levels.
            const errors = [];

            for (let i = 0; i < arrayValue.length; i++) {
                const current = arrayValue[i];
                if (!(current instanceof this.getModelClass())) {
                    errors.push({
                        code: ModelError.INVALID_ATTRIBUTE,
                        data: {
                            index: i
                        },
                        message: `Validation failed, item at index ${i} not an instance of Model class.`
                    });
                    continue;
                }
                try {
                    await current.validate();
                } catch (e) {
                    errors.push({
                        code: e.code,
                        data: { index: i, ...e.data },
                        message: e.message
                    });
                }
            }

            if (!_.isEmpty(errors)) {
                throw new ModelError("Validation failed.", ModelError.INVALID_ATTRIBUTE, errors);
            }
        }
    }
}

export default ModelsAttribute;
