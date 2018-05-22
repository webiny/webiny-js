import ParagraphPreviewWidget from "./widgets/paragraph";
import ImagePreviewWidget from "./widgets/image";
import CMS from "./services/CMS";

export default () => {
    return ({ app }, next) => {
        app.services.register("cms", () => new CMS());

        const cmsService = app.services.get("cms");

        // Render widgets
        cmsService.addWidget({
            type: "paragraph",
            widget: new ParagraphPreviewWidget()
        });
        cmsService.addWidget({
            type: "image",
            widget: new ImagePreviewWidget()
        });

        app.router.addRoute({
            name: "CmsPreview",
            path: "/cms/preview/:revision"
        });

        next();
    };
};
