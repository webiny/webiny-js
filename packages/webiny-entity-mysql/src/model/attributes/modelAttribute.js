// @flow
import { ModelAttribute as BaseModelAttribute } from "webiny-model";

class ModelAttribute extends BaseModelAttribute {
    setStorageValue(value: mixed): this {
        if (typeof value === "string") {
            return super.setStorageValue(JSON.parse(value));
        }
        return this;
    }

    async getStorageValue() {
        const value = await BaseModelAttribute.prototype.getStorageValue.call(this);
        return value ? JSON.stringify(value) : value;
    }
}

export default ModelAttribute;
