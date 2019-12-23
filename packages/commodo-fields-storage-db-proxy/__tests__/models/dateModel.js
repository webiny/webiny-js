import Model from "./model";

class DateModel extends Model {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("createdOn").date();
    }
}

DateModel.classId = "DateModel";
export default DateModel;
