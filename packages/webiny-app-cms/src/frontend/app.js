import TextWidgetRender from "./widgets/text";
import TextWithIconWidgetRender from "./widgets/textWithIcon";
import ImageWithTextWidgetRender from "./widgets/imageWithText";
import CMS from "./services/CMS";

export default () => {
    return ({ app }, next) => {
        app.modules.register({
            name: "SlateEditor",
            factory: () => import("./../utils/SlateEditor/Slate")
        });

        app.services.register("cms", () => new CMS());

        const cmsService = app.services.get("cms");

        // Render widgets
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

        app.router.addRoute({
            name: "CmsPreview",
            path: "/cms/preview/:revision"
        });

        next();
    };
};
