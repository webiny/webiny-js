// @flow
import type { Attribute } from ".";

class AttributeValue {
    attribute: Attribute;
    current: mixed;
    dirty: boolean;
    set: boolean;

    constructor(attribute: Attribute) {
        this.attribute = attribute;
        this.current = null;
        this.dirty = false;
        this.set = false;
    }

    setCurrent(value: mixed, options: Object = {}): this {
        // If needed, implement skipMarkAsSet option (at the time of implementation, it was not needed).
        this.set = true;

        if (!options.skipDifferenceCheck) {
            if (this.isDifferentFrom(value)) {
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

    clean(): this {
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
}

export default AttributeValue;
