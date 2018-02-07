// @flow
import Attribute from "./../attribute";
import _ from "lodash";

class FloatAttribute extends Attribute {
    async validateType(value: mixed) {
        // As long it is a number, it's good because JS has only one type of numbers.
        !_.isNumber(value) && this.expected("float", typeof value);
    }
}

export default FloatAttribute;
