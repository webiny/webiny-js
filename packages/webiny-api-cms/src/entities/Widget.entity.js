// @flow
import { Entity } from "webiny-api/lib/entities";

class Widget extends Entity {
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

Widget.classId = "CmsWidget";
Widget.storageClassId = "Cms_Widgets";

export default Widget;
