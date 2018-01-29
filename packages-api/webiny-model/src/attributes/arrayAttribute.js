// @flow
import Attribute from "./../attribute";
import _ from "lodash";
import Model from "./../model";
import ModelError from "./../modelError";
import { AttributesContainer } from "../index";

class ArrayAttribute extends Attribute {
    constructor(name: string, attributesContainer: AttributesContainer) {
        super(name, attributesContainer);
    }

    setValue(value: any) {
        if (!this.canSetValue()) {
            return;
        }

        // Even if the value is invalid (eg. a string), we allow it here, but calling validate() will fail.
        if (!(value instanceof Array)) {
            this.value.setCurrent(value);
            return;
        }

        this.value.setCurrent(value);
    }

    async validate(): Promise<void> {
        if (!this.isSet()) {
            return;
        }

        const attrValue = this.value.getCurrent();
        if (!(attrValue instanceof Array)) {
            this.expected("array", typeof attrValue);
        }

        const errors = [];
        const currentValue = ((attrValue: any): Array<Model>);

        for (let i = 0; i < currentValue.length; i++) {
            const current = currentValue[i];
            if (!this.__isPrimitiveValue(current)) {
                errors.push({
                    type: ModelError.INVALID_ATTRIBUTE,
                    data: {
                        index: i
                    },
                    message: `Validation failed, item at index ${i} not a primitive value.`
                });
            }
        }

        if (!_.isEmpty(errors)) {
            throw new ModelError("Validation failed.", ModelError.INVALID_ATTRIBUTE, {
                items: errors
            });
        }
    }

    getValue(): Array<string | number> | null {
        return (super.getValue(): any);
    }

    __isPrimitiveValue(value: any): boolean {
        return _.isString(value) || _.isNumber(value) || _.isBoolean(value) || _.isNull(value);
    }
}

export default ArrayAttribute;
