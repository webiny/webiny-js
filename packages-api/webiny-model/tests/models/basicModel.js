const Model = require('./../../src/model');

class BasicModel extends Model {
    constructor() {
        super();
        this.attr('attr1').char().setValidators('required');
        this.attr('attr2').char().setValidators('required');
        this.attr('attr3').char().setValidators('required');
    }
}

module.exports = BasicModel;