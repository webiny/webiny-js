// @flow
import { AttributeValue } from "webiny-model";

class ModelAttributeValue extends AttributeValue {
    isDifferentFrom(value: mixed): boolean {
        return JSON.stringify(value) !== JSON.stringify(this.current);
    }
}

export default ModelAttributeValue;
