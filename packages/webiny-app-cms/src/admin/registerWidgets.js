// @flow
import _ from "lodash";
import { app } from "webiny-app";
import type CMS from "./services/CMS";

import ParagraphWidget from "./widgets/paragraph";
import ImageWidget from "./widgets/image";

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
