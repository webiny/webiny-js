import { createFeature } from "@webiny/feature/admin";
import { LayoutEditorPresenter as PresenterAbstraction } from "./abstractions.js";
import { LayoutEditorPresenterRegistration } from "./LayoutEditorPresenter.js";
import { LayoutRevisionsFeature } from "./Revisions/feature.js";
import { LayoutPreviewPageFeature } from "./PreviewPage/feature.js";
import { LayoutAutoSaveFeature } from "./AutoSave/feature.js";
import { LayoutPropertiesFeature } from "./Properties/feature.js";

export const LayoutEditorFeature = createFeature({
    name: "WebsiteBuilder/LayoutEditor",
    register(container) {
        // Not a singleton: each open layout editor loads its own layout.
        container.register(LayoutEditorPresenterRegistration);

        LayoutRevisionsFeature.register(container);
        LayoutPreviewPageFeature.register(container);
        LayoutAutoSaveFeature.register(container);
        LayoutPropertiesFeature.register(container);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
