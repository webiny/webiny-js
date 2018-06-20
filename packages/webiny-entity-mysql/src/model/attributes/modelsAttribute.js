// @flow
import { ModelsAttribute as BaseModelsAttribute } from "webiny-model";

class ModelsAttribute extends BaseModelsAttribute {
    setStorageValue(value: mixed): this {
        if (typeof value === "string") {
            super.setStorageValue(JSON.parse(value));
        }
        return this;
    }

    async getStorageValue(): Promise<any> {
        return JSON.stringify(await BaseModelsAttribute.prototype.getStorageValue.call(this));
    }
}

export default ModelsAttribute;
