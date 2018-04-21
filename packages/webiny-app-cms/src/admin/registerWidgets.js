// @flow
import _ from "lodash";
import { app } from "webiny-app";
import type CMS from "./services/CMS";

import paragraphWidget from "./widgets/paragraph/index";
import imageWidget from "./widgets/image/index";

import paragraphPreviewWidget from "./../widgets/paragraph/index";
import imagePreviewWidget from "./../widgets/image/index";

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
    cmsService.addEditorWidget("text", paragraphWidget);
    cmsService.addEditorWidget("media", imageWidget);

    // Preview widgets
    cmsService.addWidget(paragraphPreviewWidget);
    cmsService.addWidget(imagePreviewWidget);

    // Global widgets
    const loadWidgets = app.graphql.generateList("CmsWidget", "id title type data settings");

    return loadWidgets({ variables: { perPage: 1000 } }).then(({ data }) => {
        data.list.map(widget => {
            const baseWidget = _.cloneDeep(cmsService.getEditorWidget(widget.type));
            const globalWidget = {
                origin: widget.id,
                ...baseWidget,
                ..._.pick(widget, ["title", "data", "settings"])
            };

            cmsService.addEditorWidget("global", globalWidget);
        });
    });
};
