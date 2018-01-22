import { ModelAttribute as BaseModelAttribute } from "webiny-model";

class ModelAttribute extends BaseModelAttribute {
    setStorageValue(value) {
        this.setValue(JSON.parse(value));
        return this;
    }

    async getStorageValue() {
        if (this.isEmpty()) {
            return null;
        }
        return JSON.stringify(await BaseModelAttribute.prototype.getStorageValue.call(this));
    }
}

export default ModelAttribute;
