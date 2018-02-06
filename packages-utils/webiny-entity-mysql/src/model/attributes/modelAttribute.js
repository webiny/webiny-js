import { ModelAttribute as BaseModelAttribute } from "webiny-model";

class ModelAttribute extends BaseModelAttribute {
    setStorageValue(value) {
        return super.setStorageValue(JSON.parse(value));
    }

    async getStorageValue() {
        if (this.isEmpty()) {
            return null;
        }
        return JSON.stringify(await BaseModelAttribute.prototype.getStorageValue.call(this));
    }
}

export default ModelAttribute;
