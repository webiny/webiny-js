const Attribute = require('./../attribute');
const _ = require('lodash');

class DateAttribute extends Attribute {
	validateType() {
		!_.isDate(this.value.current) && this.expected('Date object', typeof this.value.current);
	}
}

module.exports = DateAttribute;