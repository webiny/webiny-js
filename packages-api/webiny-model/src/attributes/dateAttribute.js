// @flow
import Attribute from "./../attribute";
import _ from "lodash";

class DateAttribute extends Attribute {
    validateType() {
        !_.isDate(this.value.getCurrent()) &&
            this.expected("Date object", typeof this.value.getCurrent());
    }

    setValue(value: Date | string | number) {
        this.value.setCurrent(value);
    }
}

export default DateAttribute;
