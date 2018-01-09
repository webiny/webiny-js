const Model = require('./../../src/model');

class ValidationTestModel extends Model
{
    constructor() {
        super();
        this.attr('email').char().setValidators('required,email').setOnce();
        this.attr('required1').char().setValidators('required');
        this.attr('required2').char().setValidators('required');
    }
}

module.exports = ValidationTestModel;