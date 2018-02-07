// @flow
import Attribute from "./../attribute";
import _ from "lodash";

class CharAttribute extends Attribute {
    async validateType(value: mixed) {
        !_.isString(value) && this.expected("string", typeof value);
    }
}

export default CharAttribute;
