const Attribute = require('./../attribute');
import _ from 'lodash';

class CharAttribute extends Attribute {
	validateType() {
		!_.isString(this.value.getCurrent()) && this.expected('string', typeof this.value.getCurrent());
	}
}

module.exports = CharAttribute;