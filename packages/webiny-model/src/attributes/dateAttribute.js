// @flow
import Attribute from "./../attribute";
import _ from "lodash";
import DateAttributeValue from "./dateAttributeValue";

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

    /**
     * Returns AttributeValue class to be used on construct.
     * @returns {AttributeValue}
     */
    getAttributeValueClass() {
        return DateAttributeValue;
    }
}

export default DateAttribute;
