import { ModelAttribute as BaseModelAttribute } from "webiny-model";

class ModelAttribute extends BaseModelAttribute {
    setStorageValue(value) {
        return super.setStorageValue(JSON.parse(value));
    }

    async getStorageValue() {
        const value = await BaseModelAttribute.prototype.getStorageValue.call(this);
        return value ? JSON.stringify(value) : value;
    }
}

export default ModelAttribute;
