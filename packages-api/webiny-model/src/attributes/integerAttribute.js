const Attribute = require('./../attribute');
const _ = require('lodash');

class IntegerAttribute extends Attribute {
	async validate() {
        if (this.isSet() && !_.isInteger(this.value.current)) {
            this.expected('integer', typeof this.value.current);
        }

        return Attribute.prototype.validate.call(this);
    }
}

module.exports = IntegerAttribute;