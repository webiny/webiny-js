// @flow
import { app } from "webiny-client";
import type CMS from "./../services/CMS";

import TextWidget from "./text";
import TextWithIconWidget from "./textWithIcon";
import ImageWithTextWidget from "./imageWithText";

import TextWidgetRender from "frontend/widgets/text";
import TextWithIconWidgetRender from "frontend/widgets/textWithIcon";
import ImageWithTextWidgetRender from "frontend/widgets/imageWithText";

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

    /* cmsService.addWidgetGroup({
        name: "global",
        title: "Global",
        icon: "globe"
    });*/

    // Editor widgets
    cmsService.addEditorWidget({
        group: "text",
        type: "text",
        widget: new TextWidget(),
        tags: ["text", "paragraph", "blog"]
    });

    cmsService.addEditorWidget({
        group: "text",
        type: "text-with-icon",
        widget: new TextWithIconWidget(),
        tags: ["text", "paragraph", "blog", "icon"]
    });

    cmsService.addEditorWidget({
        group: "media",
        type: "image-with-text",
        widget: new ImageWithTextWidget(),
        tags: ["text", "paragraph", "blog", "image", "picture", "photo", "foto"]
    });

    // Preview widgets
    cmsService.addWidget({
        type: "text",
        widget: new TextWidgetRender()
    });

    cmsService.addWidget({
        type: "text-with-icon",
        widget: new TextWithIconWidgetRender()
    });

    cmsService.addWidget({
        type: "image-with-text",
        widget: new ImageWithTextWidgetRender()
    });

    // Global widgets
    /*const loadWidgets = app.graphql.generateList("CmsWidget", "id title type data settings");

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
    });*/
};
