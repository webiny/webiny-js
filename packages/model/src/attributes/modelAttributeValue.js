// @flow
import { AttributeValue } from "@webiny/model";
import { Model } from "@webiny/model";

class ModelAttributeValue extends AttributeValue {
    isDifferentFrom(value: mixed): boolean {
        if (value instanceof Model) {
            if (this.current instanceof Model) {
                return true;
            }
            return true;
        }

        return value !== this.current;
    }

    isDirty(): boolean {
        if (super.isDirty()) {
            return true;
        }
        return this.current instanceof Model && this.current.isDirty();
    }

    isClean(): boolean {
        return !this.isDirty();
    }
}

export default ModelAttributeValue;
