// @flow
import { Model, Attribute } from "webiny-model";

class WidgetModel extends Model {
    id: string;
    type: string;
    data: Object;
    constructor() {
        super();
        this.attr("id").char();
        this.attr("type").char();
        this.attr("data").object();
    }

    copy() {
        const model = new WidgetModel();
        Object.keys(this.getAttributes()).forEach((name: string) => {
            const currentAttribute: Attribute = (this.getAttribute(name): any);
            const newAttribute: Attribute = (model.getAttribute(name): any);
            newAttribute.setValue(currentAttribute.getValue());
        });
        return model;
    }
}

WidgetModel.classId = "CmsWidgetModel";
export default WidgetModel;
