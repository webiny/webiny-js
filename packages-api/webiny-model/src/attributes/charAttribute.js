const Attribute = require('./../attribute');
const _ = require('lodash');

class CharAttribute extends Attribute {
	validateType() {
		!_.isString(this.value.getCurrent()) && this.expected('string', typeof this.value.getCurrent());
	}
}

module.exports = CharAttribute;