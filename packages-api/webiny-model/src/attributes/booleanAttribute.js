const Attribute = require('./../attribute');
const _ = require('lodash');

class BooleanAttribute extends Attribute {
    validateType() {
		!_.isBoolean(this.value.current) && this.expected('boolean', typeof this.value.current);
    }
}

module.exports = BooleanAttribute;