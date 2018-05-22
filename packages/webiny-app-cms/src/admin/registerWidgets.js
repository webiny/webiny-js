// @flow
import { app } from "webiny-app";
import type CMS from "./services/CMS";

import ParagraphWidget from "./widgets/pageEditor/paragraph";
import ImageWidget from "./widgets/pageEditor/image";
import WysiwygWidget from "./widgets/pageEditor/wysiwyg";

import ParagraphPreviewWidget from "./../widgets/paragraph/index";
import ImagePreviewWidget from "./../widgets/image/index";
import WysiwygPreviewWidget from "./widgets/pageEditor/wysiwyg/editor";

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
        type: "paragraph",
        title: "Paragraph",
        icon: ["fas", "align-left"],
        widget: new ParagraphWidget(),
        data: {
            text:
                "Nullam molestie, tortor id rhoncus scelerisque, ex justo tincidunt nisl, non dignissim justo urna ac ex. Etiam a ultrices justo. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut aliquet at nulla id laoreet. Fusce tellus diam, suscipit vel interdum ac, consequat vel ex.",
            title: "Paragraph title",
            iconSize: "3x",
            icon: {
                icon: "star",
                id: "fas-star",
                prefix: "fas"
            }
        }
    });

    cmsService.addEditorWidget({
        group: "text",
        type: "wysiwyg",
        title: "Wysiwyg",
        icon: ["fas", "align-left"],
        widget: new WysiwygWidget(),
        data: {}
    });

    cmsService.addEditorWidget({
        group: "media",
        type: "image",
        title: "Image",
        icon: ["fas", "image"],
        widget: new ImageWidget(),
        data: {
            title: "Image title",
            heading: "h2",
            text:
                "Nullam molestie, tortor id rhoncus scelerisque, ex justo tincidunt nisl, non dignissim justo urna ac ex. Etiam a ultrices justo. Pellentesque habitant morbi tristique senectus et netus et malesuada fames.",
            image: null,
            imagePosition: "left"
        }
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

    cmsService.addWidget({
        type: "wysiwyg",
        widget: new WysiwygPreviewWidget()
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
