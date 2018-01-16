const Attribute = require('./../attribute');
const _ = require('lodash');

class IntegerAttribute extends Attribute {
	validateType() {
		!_.isInteger(this.value.getCurrent()) && this.expected('integer', typeof this.value.getCurrent());
	}
}

module.exports = IntegerAttribute;