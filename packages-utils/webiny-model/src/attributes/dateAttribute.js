// @flow
import Attribute from "./../attribute";
import _ from "lodash";

class DateAttribute extends Attribute {
    async validateType(value: mixed) {
        !_.isDate(value) && this.expected("Date object", typeof value);
    }

    setValue(value: mixed) {
        if (typeof value === "number" || typeof value === "string") {
            this.value.setCurrent(new Date(value));
        } else {
            this.value.setCurrent(value);
        }
    }
}

export default DateAttribute;
