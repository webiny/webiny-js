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
    getValue(params: Array<any> = [], processCallbacks: boolean = true): any {
        return this.callback.call(this.getParentModel(), { model: this.getParentModel() });
    }
}

export default DynamicAttribute;
