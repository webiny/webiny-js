const Attribute = require('./../attribute');
const _ = require('lodash');

class DateAttribute extends Attribute {
	validateType() {
		!_.isDate(this.value.getCurrent()) && this.expected('Date object', typeof this.value.getCurrent());
	}
}

module.exports = DateAttribute;