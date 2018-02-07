// @flow
import Attribute from "./../attribute";
import _ from "lodash";

class IntegerAttribute extends Attribute {
    async validateType(value: mixed) {
        !_.isInteger(value) && this.expected("integer", typeof value);
    }
}

export default IntegerAttribute;
