// @flow
import { app } from "webiny-app";
import type CMS from "./../services/CMS";

import TextWidget from "./text";
import TextWithIconWidget from "./textWithIcon";
import ImageWithTextWidget from "./imageWithText";

import TextWidgetRender from "./../../frontend/widgets/text";
import TextWithIconWidgetRender from "./../../frontend/widgets/textWithIcon";
import ImageWithTextWidgetRender from "./../../frontend/widgets/imageWithText";

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
        title: "Text",
        widget: new TextWidget(),
        data: {
            text:
                "Nullam molestie, tortor id rhoncus scelerisque, ex justo tincidunt nisl, non dignissim justo urna ac ex. Etiam a ultrices justo. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut aliquet at nulla id laoreet. Fusce tellus diam, suscipit vel interdum ac, consequat vel ex."
        }
    });

    cmsService.addEditorWidget({
        group: "text",
        type: "text-with-icon",
        title: "Text with icon",
        widget: new TextWithIconWidget(),
        data: {
            text:
                "Nullam molestie, tortor id rhoncus scelerisque, ex justo tincidunt nisl, non dignissim justo urna ac ex. Etiam a ultrices justo. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut aliquet at nulla id laoreet. Fusce tellus diam, suscipit vel interdum ac, consequat vel ex.",
            iconSize: "3x",
            icon: {
                icon: "star",
                id: "fas-star",
                prefix: "fas"
            }
        }
    });

    cmsService.addEditorWidget({
        group: "media",
        type: "image-with-text",
        title: "Image with text",
        widget: new ImageWithTextWidget(),
        data: {
            text:
                "Nullam molestie, tortor id rhoncus scelerisque, ex justo tincidunt nisl, non dignissim justo urna ac ex. Etiam a ultrices justo. Pellentesque habitant morbi tristique senectus et netus et malesuada fames.",
            image: null,
            imagePosition: "left",
            imageSize: 50,
            padding: 15
        }
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
