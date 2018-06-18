// @flow
import type { Attribute } from ".";
import type { AttributeValueState } from "./../types";

class AttributeValue {
    attribute: Attribute;
    current: mixed;
    dirty: boolean;
    set: boolean;
    state: AttributeValueState;

    constructor(attribute: Attribute) {
        this.attribute = attribute;
        this.current = null;
        this.dirty = false;
        this.set = false;
        this.state = { loading: false, loaded: false };
    }

    setCurrent(value: mixed, options: Object = {}): this {
        // If needed, implement skipMarkAsSet option (at the time of implementation, it was not needed).
        this.set = true;

        if (options.skipDifferenceCheck) {
            if (options.forceSetAsDirty) {
                this.dirty = true;
            } else {
                if (options.forceSetAsClean) {
                    this.dirty = false;
                }
            }
        } else {
            if (!this.dirty && this.isDifferentFrom(value)) {
                this.dirty = true;
            }
        }

        this.current = value;
        return this;
    }

    getCurrent(): mixed {
        return this.current;
    }

    isDifferentFrom(value: mixed): boolean {
        return this.current !== value;
    }

    isDirty(): boolean {
        return this.dirty;
    }

    isClean(): boolean {
        return !this.isDirty();
    }

    clean(): AttributeValue {
        this.dirty = false;
        return this;
    }

    isSet(): boolean {
        return this.set;
    }

    reset(): void {
        this.current = null;
        this.dirty = false;
        this.set = false;
    }

    isLoaded() {
        return this.state.loaded;
    }

    isLoading() {
        return this.state.loading;
    }
}

export default AttributeValue;
