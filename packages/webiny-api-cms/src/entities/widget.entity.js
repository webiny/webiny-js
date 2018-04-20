// @flow
import { Entity } from "webiny-api";

class Widget extends Entity {
    constructor() {
        super();

        this.attr("title").char();
        this.attr("type").char();
        this.attr("data").object();
        this.attr("settings").object();
    }
}

Widget.classId = "CmsWidget";
Widget.tableName = "Cms_Widgets";

export default Widget;
