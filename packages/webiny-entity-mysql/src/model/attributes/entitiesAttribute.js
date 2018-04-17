import { EntitiesAttribute as BaseEntitiesAttribute } from "webiny-entity";

class EntitiesAttribute extends BaseEntitiesAttribute {
    async getStorageValue() {
        return JSON.stringify(await BaseEntitiesAttribute.prototype.getStorageValue.call(this));
    }

    setStorageValue(value) {
        return super.setStorageValue(JSON.parse(value));
    }
}

export default EntitiesAttribute;
