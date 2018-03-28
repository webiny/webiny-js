// @flow
import Attribute from "./../attribute";
import { AttributesContainer } from "../index";

class DynamicAttribute extends Attribute {
    callback: Function;

    constructor(name: string, attributesContainer: AttributesContainer, callback: Function) {
        super(name, attributesContainer);
        this.callback = callback;
        this.toStorage = false;
    }

    canSetValue(): boolean {
        return false;
    }

    // eslint-disable-next-line
    getValue(): mixed {
        const current = this.callback.call(this.getParentModel(), ...arguments);
        return this.onGetCallback(current, ...arguments);
    }
}

export default DynamicAttribute;
