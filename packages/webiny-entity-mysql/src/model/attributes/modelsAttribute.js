// @flow
import { ModelsAttribute as BaseModelsAttribute } from "webiny-model";

class ModelsAttribute extends BaseModelsAttribute {
    setStorageValue(value: any) {
        return super.setStorageValue(JSON.parse(value));
    }

    async getStorageValue() {
        return JSON.stringify(await BaseModelsAttribute.prototype.getStorageValue.call(this));
    }
}

export default ModelsAttribute;
