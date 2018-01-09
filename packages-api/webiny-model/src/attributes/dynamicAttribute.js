const Attribute = require('./../attribute');

class DynamicAttribute extends Attribute {
    constructor(name, attributesContainer, callback) {
        super(name, attributesContainer);
        this.callback = callback;
        this.toStorage = false;
    }

    canSetValue() {
        return false;
    }

    getValue(params = [], processCallbacks = true) {
        return this.callback.call(this.getParentModel(), {model: this.getParentModel()});
    }
}

module.exports = DynamicAttribute;