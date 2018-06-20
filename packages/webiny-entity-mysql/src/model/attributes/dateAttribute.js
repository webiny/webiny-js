// @flow
import { DateAttribute as BaseDateAttribute } from "webiny-model";
import fecha from "fecha";

class DateAttribute extends BaseDateAttribute {
    setStorageValue(value: mixed) {
        if (value === null) {
            return super.setStorageValue(value);
        }

        if (value instanceof Date) {
            return super.setStorageValue(value);
        }

        return super.setStorageValue(fecha.parse(value, "YYYY-MM-DD HH:mm:ss"));
    }

    async getStorageValue() {
        const value = await BaseDateAttribute.prototype.getStorageValue.call(this);
        if (value instanceof Date) {
            return fecha.format(value, "YYYY-MM-DD HH:mm:ss");
        }
        return value;
    }
}

export default DateAttribute;
