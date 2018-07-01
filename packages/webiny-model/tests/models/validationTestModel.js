import Model from "webiny-model/model";

class ValidationTestModel extends Model {
    constructor() {
        super();
        this.attr("email")
            .char()
            .setValidators("required,email")
            .setOnce();
        this.attr("required1")
            .char()
            .setValidators("required");
        this.attr("required2")
            .char()
            .setValidators("required");
        this.attr("type")
            .char()
            .setValidators("in:bird:dog:parrot");
    }
}

export default ValidationTestModel;
