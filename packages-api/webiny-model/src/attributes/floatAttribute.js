const Attribute = require('./../attribute');
const _ = require('lodash');

class FloatAttribute extends Attribute {
	async validate() {
        // As long it is a number, it's good because Js has only one type of numbers.
        if (this.isSet() && !_.isNumber(this.value.current)) {
            this.expected('float', typeof this.value.current);
        }

        return Attribute.prototype.validate.call(this);
    }
}

module.exports = FloatAttribute;