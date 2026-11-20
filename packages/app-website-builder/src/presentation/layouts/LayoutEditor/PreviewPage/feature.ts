import { createFeature } from "@webiny/feature/admin";
import { LayoutPreviewPagePresenter as PresenterAbstraction } from "./abstractions.js";
import { LayoutPreviewPagePresenterRegistration } from "./LayoutPreviewPagePresenter.js";
import { LayoutPreviewPageStorage } from "./LayoutPreviewPageStorage.js";

export const LayoutPreviewPageFeature = createFeature({
    name: "WebsiteBuilder/LayoutEditor/PreviewPage",
    register(container) {
        container.register(LayoutPreviewPageStorage).inSingletonScope();
        // Not a singleton: each open layout editor previews its own page.
        container.register(LayoutPreviewPagePresenterRegistration);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
