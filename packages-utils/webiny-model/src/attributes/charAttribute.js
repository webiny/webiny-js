// @flow
import Attribute from "./../attribute";
import _ from "lodash";

class CharAttribute extends Attribute {
    validateType() {
        !_.isString(this.value.getCurrent()) &&
            this.expected("string", typeof this.value.getCurrent());
    }
}

export default CharAttribute;
