const Attribute = require('./../attribute');
const _ = require('lodash');

class IntegerAttribute extends Attribute {
	validateType() {
		!_.isInteger(this.value.current) && this.expected('integer', typeof this.value.current);
	}
}

module.exports = IntegerAttribute;