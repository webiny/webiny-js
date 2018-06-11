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

    copy() {
        const model = new WidgetModel();
        Object.keys(this.getAttributes()).forEach(name => {
            model[name] = this.getAttribute(name).getValue();
        });
        return model;
    }
}

WidgetModel.classId = "CmsWidgetModel";
export default WidgetModel;
