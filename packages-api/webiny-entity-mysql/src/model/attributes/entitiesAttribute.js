import { attributes } from "webiny-entity";

class EntitiesAttribute extends attributes.entities {
    async getStorageValue() {
        if (this.isEmpty()) {
            return null;
        }

        return JSON.stringify(await attributes.entities.prototype.getStorageValue.call(this));
    }

    setStorageValue(value) {
        super.setStorageValue(JSON.parse(value));
        return this;
    }
}

export default EntitiesAttribute;
