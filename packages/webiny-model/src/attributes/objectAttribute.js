// @flow
import Attribute from "./../attribute";

class ObjectAttribute extends Attribute {
    /**
     * If value is assigned (checked in the parent validate call), it must by an instance of object.
     */
    async validateType(value: mixed) {
        if (value instanceof Object) {
            return;
        }
        this.expected("object", typeof value);
    }
}

export default ObjectAttribute;
