import paragraphPreviewWidget from "./widgets/paragraph/index";
import imagePreviewWidget from "./widgets/image/index";
import CMS from "./services/CMS";

export default () => {
    return ({ app }, next) => {
        app.services.register("cms", () => new CMS());

        const cmsService = app.services.get("cms");

        // Render widgets
        cmsService.addWidget(paragraphPreviewWidget);
        cmsService.addWidget(imagePreviewWidget);

        app.router.addRoute({
            name: "CmsPreview",
            path: "/cms/preview/:revision"
        });

        next();
    };
};
