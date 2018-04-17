// @flow
import { ArrayAttribute as BaseArrayAttribute } from "webiny-model";

class ArrayAttribute extends BaseArrayAttribute {
    setStorageValue(value: string) {
        return super.setStorageValue(JSON.parse(value));
    }

    async getStorageValue() {
        const value = await BaseArrayAttribute.prototype.getStorageValue.call(this);
        return value ? JSON.stringify(value) : value;
    }
}

export default ArrayAttribute;
