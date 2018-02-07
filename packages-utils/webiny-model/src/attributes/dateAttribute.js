// @flow
import Attribute from "./../attribute";
import _ from "lodash";

class DateAttribute extends Attribute {
    async validateType(value: mixed) {
        !_.isDate(value) && this.expected("Date object", typeof value);
    }

    setValue(value: Date | string | number) {
        if (_.isNumber(value) || _.isString(value)) {
            this.value.setCurrent(new Date(value));
        } else {
            this.value.setCurrent(value);
        }
    }
}

export default DateAttribute;
