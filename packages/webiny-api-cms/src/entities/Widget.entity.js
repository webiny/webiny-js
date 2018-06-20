// @flow
import { Entity } from "webiny-api";

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
Widget.tableName = "Cms_Widgets";

export default Widget;
