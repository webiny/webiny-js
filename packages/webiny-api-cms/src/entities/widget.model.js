import { Model } from "webiny-model";

class WidgetModel extends Model {
    constructor() {
        super();
        this.attr("id").char();
        this.attr("type").char();
        this.attr("origin").char();
        this.attr("data").object();
        this.attr("settings").object();
    }
}

WidgetModel.classId = "CmsWidgetModel";
export default WidgetModel;
