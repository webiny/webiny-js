const Attribute = require('./../attribute');
const _ = require('lodash');

class DateAttribute extends Attribute {
	async validate() {
        if (this.isSet() && !_.isDate(this.value.current)) {
            this.expected('Date object', typeof this.value.current);
        }

        return Attribute.prototype.validate.call(this);
    }
}

module.exports = DateAttribute;