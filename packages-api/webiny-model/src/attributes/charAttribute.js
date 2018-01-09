const Attribute = require('./../attribute');
const _ = require('lodash');

class CharAttribute extends Attribute {
    async validate() {
        if (this.isSet() && !_.isString(this.value.current)) {
            this.expected('string', typeof this.value.current);
        }

        return Attribute.prototype.validate.call(this);
    }
}

module.exports = CharAttribute;