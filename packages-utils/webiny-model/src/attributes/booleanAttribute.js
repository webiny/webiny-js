// @flow
import Attribute from "./../attribute";
import _ from "lodash";

class BooleanAttribute extends Attribute {
    async validateType(value: mixed) {
        !_.isBoolean(value) && this.expected("boolean", typeof value);
    }
}

export default BooleanAttribute;
