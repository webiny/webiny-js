// @flow
import { Entity } from "webiny-api/lib/entities";

class WidgetPreset extends Entity {
    title: string;
    type: string;
    data: Object;
    constructor() {
        super();
        this.attr("title").char();
        this.attr("type").char();
        this.attr("data").object();
    }
}

WidgetPreset.classId = "CmsWidgetPreset";
WidgetPreset.storageClassId = "Cms_WidgetPresets";

export default WidgetPreset;
