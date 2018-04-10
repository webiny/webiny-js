// @flow
import { ArrayAttribute as BaseArrayAttribute } from "webiny-model";

class ArrayAttribute extends BaseArrayAttribute {
    setStorageValue(value: string) {
        this.setValue(JSON.parse(value));
        return this;
    }

    async getStorageValue() {
        const value = await BaseArrayAttribute.prototype.getStorageValue.call(this);
        return value ? JSON.stringify(value) : value;
    }
}

export default ArrayAttribute;
