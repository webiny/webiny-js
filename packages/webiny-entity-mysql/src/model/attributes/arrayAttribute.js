// @flow
import { ArrayAttribute as BaseArrayAttribute } from "webiny-model";

class ArrayAttribute extends BaseArrayAttribute {
    setStorageValue(value: mixed) {
        if (typeof value === "string") {
            super.setStorageValue(JSON.parse(value));
        } else {
            super.setStorageValue(value);
        }
        return this;
    }

    async getStorageValue() {
        const value = await BaseArrayAttribute.prototype.getStorageValue.call(this);
        return value ? JSON.stringify(value) : value;
    }
}

export default ArrayAttribute;
