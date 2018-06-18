// @flow
import { ObjectAttribute as BaseObjectAttribute } from "webiny-model";

class ObjectAttribute extends BaseObjectAttribute {
    setStorageValue(value: mixed) {
        if (typeof value === "string") {
            super.setStorageValue(JSON.parse(value));
        } else {
            super.setStorageValue(value);
        }
        return this;
    }

    async getStorageValue() {
        const value = await BaseObjectAttribute.prototype.getStorageValue.call(this);
        return value ? JSON.stringify(value) : value;
    }
}

export default ObjectAttribute;
