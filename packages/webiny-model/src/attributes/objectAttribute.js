// @flow
import Attribute from "./../attribute";
import ObjectAttributeValue from "./objectAttributeValue";

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

    /**
     * Returns AttributeValue class to be used on construct.
     * @returns {AttributeValue}
     */
    getAttributeValueClass() {
        return ObjectAttributeValue;
    }
}

export default ObjectAttribute;
