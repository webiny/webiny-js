// @flow
import { Entity } from "webiny-api/lib/entities";
import WidgetModel from "./Widget.model";

class Layout extends Entity {
    title: string;
    slug: string;
    content: Array<WidgetModel>;
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
Layout.storageClassId = "Cms_Layouts";

export default Layout;
