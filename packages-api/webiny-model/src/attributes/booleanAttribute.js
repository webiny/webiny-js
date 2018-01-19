const Attribute = require('./../attribute');
import _ from 'lodash';

class BooleanAttribute extends Attribute {
    validateType() {
		!_.isBoolean(this.value.getCurrent()) && this.expected('boolean', typeof this.value.getCurrent());
    }
}

module.exports = BooleanAttribute;