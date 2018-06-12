// @flow
import { Entity } from "webiny-api";
import WidgetModel from "./widget.model";

class Layout extends Entity {
    constructor() {
        super();

        this.attr("title")
            .char()
            .setValidators("required");

        this.attr("slug")
            .char()
            .setValidators("required");

        this.attr("content")
            .models(WidgetModel)
            .onSet(widgets => {
                return widgets.map(widget => {
                    if (widget.origin) {
                        delete widget["data"];
                        delete widget["settings"];
                    }
                    return widget;
                });
            });
    }
}

Layout.classId = "CmsLayout";
Layout.tableName = "Cms_Layouts";

export default Layout;
