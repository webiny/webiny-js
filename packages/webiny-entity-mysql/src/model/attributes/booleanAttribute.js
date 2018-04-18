import { BooleanAttribute as BaseBooleanAttribute } from "webiny-model";

class BooleanAttribute extends BaseBooleanAttribute {
    /**
     * We must make sure a boolean value is sent, and not 0 or 1, which are stored in MySQL.
     * @param value
     */
    setStorageValue(value) {
        if (value === 1) {
            return super.setStorageValue(true);
        }

        if (value === 0) {
            return super.setStorageValue(false);
        }

        return super.setStorageValue(value);
    }

    async getStorageValue() {
        const value = await BaseBooleanAttribute.prototype.getStorageValue.call(this);
        if (value === true) {
            return 1;
        }

        if (value === false) {
            return 0;
        }

        return value;
    }
}

export default BooleanAttribute;
