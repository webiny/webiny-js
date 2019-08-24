// @flow
import { AttributeValue } from "@webiny/model";

class DateAttributeValue extends AttributeValue {
    isDifferentFrom(value: mixed): boolean {
        return String(value) !== String(this.current);
    }
}

export default DateAttributeValue;
