"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
class AttributeValue {
    constructor(attribute) {
        this.attribute = attribute;
        this.current = null;
        this.dirty = false;
        this.set = false;
        this.state = { loading: false, loaded: false };
    }

    setCurrent(value, options = {}) {
        // If needed, implement skipMarkAsSet option (at the time of implementation, it was not needed).
        this.set = true;

        if (options.skipDifferenceCheck) {
            if (options.forceSetAsDirty) {
                this.dirty = true;
            }
        } else {
            if (!this.dirty && this.isDifferentFrom(value)) {
                this.dirty = true;
            }
        }

        this.current = value;
        return this;
    }

    getCurrent() {
        return this.current;
    }

    isDifferentFrom(value) {
        return this.current !== value;
    }

    isDirty() {
        return this.dirty;
    }

    isClean() {
        return !this.isDirty();
    }

    clean() {
        this.dirty = false;
        return this;
    }

    isSet() {
        return this.set;
    }

    reset() {
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

exports.default = AttributeValue;
//# sourceMappingURL=attributeValue.js.map
