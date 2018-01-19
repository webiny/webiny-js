const Attribute = require('./../attribute');
import _ from 'lodash';

class IntegerAttribute extends Attribute {
	validateType() {
		!_.isInteger(this.value.getCurrent()) && this.expected('integer', typeof this.value.getCurrent());
	}
}

module.exports = IntegerAttribute;