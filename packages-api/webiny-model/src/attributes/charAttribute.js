const Attribute = require('./../attribute');
const _ = require('lodash');

class CharAttribute extends Attribute {
	validateType() {
		!_.isString(this.value.current) && this.expected('string', typeof this.value.current);
	}
}

module.exports = CharAttribute;