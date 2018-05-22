// @flow
import _ from "lodash";
import { app } from "webiny-app";
import type CMS from "./services/CMS";

import ParagraphWidget from "./widgets/pageEditor/paragraph";
import ImageWidget from "./widgets/pageEditor/image";
import RowWidget from "./widgets/layoutEditor/row";

import ParagraphPreviewWidget from "./../widgets/paragraph/index";
import ImagePreviewWidget from "./../widgets/image/index";

export default () => {
    const cmsService: CMS = app.services.get("cms");

    cmsService.addWidgetGroup({
        name: "text",
        title: "Text",
        icon: "font"
    });

    cmsService.addWidgetGroup({
        name: "media",
        title: "Media",
        icon: "image"
    });

    cmsService.addWidgetGroup({
        name: "global",
        title: "Global",
        icon: "globe"
    });

    // Editor widgets
    cmsService.addEditorWidget({
        group: "text",
        type: "paragraph",
        title: "Paragraph",
        icon: ["fas", "align-left"],
        widget: new ParagraphWidget()
    });

    cmsService.addEditorWidget({
        group: "media",
        type: "image",
        title: "Image",
        icon: ["fas", "image"],
        widget: new ImageWidget()
    });

    // Preview widgets
    cmsService.addWidget({
        type: "paragraph",
        widget: new ParagraphPreviewWidget()
    });

    cmsService.addWidget({
        type: "image",
        widget: new ImagePreviewWidget()
    });

    // Layout editor widgets
    cmsService.addLayoutEditorWidget({
        type: "grid-12",
        widget: new RowWidget({ layout: [12], title: "Full Width" }),
        data: [{ grid: 12, widget: null }]
    });

    cmsService.addLayoutEditorWidget({
        type: "grid-6-6",
        widget: new RowWidget({ layout: [6, 6], title: "Half Half" }),
        data: [{ grid: 6, widget: null }, { grid: 6, widget: null }]
    });

    cmsService.addLayoutEditorWidget({
        type: "grid-3-3-6",
        widget: new RowWidget({ layout: [3, 3, 6], title: "One Two" }),
        data: [{ grid: 3, widget: null }, { grid: 3, widget: null }, { grid: 6, widget: null }]
    });

    cmsService.addLayoutEditorWidget({
        type: "grid-6-3-3",
        widget: new RowWidget({ layout: [6, 3, 3], title: "Two One" }),
        data: [{ grid: 6, widget: null }, { grid: 3, widget: null }, { grid: 3, widget: null }]
    });

    cmsService.addLayoutEditorWidget({
        type: "grid-3-9",
        widget: new RowWidget({ layout: [3, 9], title: "One Three" }),
        data: [{ grid: 3, widget: null }, { grid: 9, widget: null }]
    });

    cmsService.addLayoutEditorWidget({
        type: "grid-9-3",
        widget: new RowWidget({ layout: [9, 3], title: "Three One" }),
        data: [{ grid: 9, widget: null }, { grid: 3, widget: null }]
    });

    cmsService.addLayoutEditorWidget({
        type: "grid-3-3-3-3",
        widget: new RowWidget({ layout: [3, 3, 3, 3], title: "Full Split" }),
        data: [
            { grid: 3, widget: null },
            { grid: 3, widget: null },
            { grid: 3, widget: null },
            { grid: 3, widget: null }
        ]
    });

    // Global widgets
    const loadWidgets = app.graphql.generateList("CmsWidget", "id title type data settings");

    return loadWidgets({ variables: { perPage: 1000 } }).then(({ data }) => {
        data.list.map(widget => {
            const baseWidget = _.cloneDeep(cmsService.getEditorWidget(widget.type));
            const globalWidget = {
                origin: widget.id,
                ...baseWidget,
                ..._.pick(widget, ["title", "data", "settings"]),
                group: "global"
            };

            cmsService.addEditorWidget(globalWidget);
        });
    });
};
