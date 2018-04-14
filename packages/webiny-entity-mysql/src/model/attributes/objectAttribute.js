// @flow
import { ObjectAttribute as BaseObjectAttribute } from "webiny-model";

class ObjectAttribute extends BaseObjectAttribute {
    setStorageValue(value: string) {
        this.setValue(JSON.parse(value));
        return this;
    }

    async getStorageValue() {
        const value = await BaseObjectAttribute.prototype.getStorageValue.call(this);
        return value ? JSON.stringify(value) : value;
    }
}

export default ObjectAttribute;
