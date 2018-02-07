// @flow
import Attribute from "./../attribute";
import _ from "lodash";
import ModelError from "./../modelError";

class ArrayAttribute extends Attribute {
    /**
     * If value is assigned (checked in the parent validate call), it must by an instance of array.
     */
    async validateType(value: mixed) {
        if (Array.isArray(value)) {
            return;
        }
        this.expected("array", typeof value);
    }

    /**
     * @returns {Promise<void>}
     */
    async validateValue(value: mixed): Promise<void> {
        if (!Array.isArray(value)) {
            return;
        }

        const errors = [];
        for (let i = 0; i < value.length; i++) {
            const current = value[i];
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

    __isPrimitiveValue(value: any): boolean {
        return _.isString(value) || _.isNumber(value) || _.isBoolean(value) || _.isNull(value);
    }
}

export default ArrayAttribute;
