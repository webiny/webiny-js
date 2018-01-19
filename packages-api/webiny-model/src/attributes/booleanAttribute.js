import Attribute from './../attribute'
import _ from 'lodash';

class BooleanAttribute extends Attribute {
    validateType() {
		!_.isBoolean(this.value.getCurrent()) && this.expected('boolean', typeof this.value.getCurrent());
    }
}

export default BooleanAttribute;