const Attribute = require('./../attribute');
const _ = require('lodash');

class BooleanAttribute extends Attribute {
    validateType() {
		!_.isBoolean(this.value.getCurrent()) && this.expected('boolean', typeof this.value.getCurrent());
    }
}

module.exports = BooleanAttribute;