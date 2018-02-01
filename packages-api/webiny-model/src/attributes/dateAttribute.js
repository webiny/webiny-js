// @flow
import Attribute from "./../attribute";
import _ from "lodash";

class DateAttribute extends Attribute {
    validateType() {
        !_.isDate(this.value.getCurrent()) &&
            this.expected("Date object", typeof this.value.getCurrent());
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
