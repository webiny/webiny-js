const Attribute = require('./../attribute');
const _ = require('lodash');

class BooleanAttribute extends Attribute {
    async validate() {
        if (this.isSet() && !_.isBoolean(this.value.current)) {
            this.expected('boolean', typeof this.value.current);
        }

        return Attribute.prototype.validate.call(this);
    }
}

module.exports = BooleanAttribute;