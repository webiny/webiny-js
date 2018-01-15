const Attribute = require('./../attribute');
const _ = require('lodash');

class FloatAttribute extends Attribute {
	validateType() {
		// As long it is a number, it's good because JS has only one type of numbers.
		!_.isNumber(this.value.current) && this.expected('float', typeof this.value.current);
	}
}

module.exports = FloatAttribute;