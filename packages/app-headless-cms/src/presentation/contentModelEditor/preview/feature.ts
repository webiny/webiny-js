import { createFeature } from "@webiny/feature/admin";
import { ContentModelFormPreviewPresenter } from "./abstractions.js";
import { ContentModelFormPreviewPresenterImplementation } from "./ContentModelFormPreviewPresenter.js";

export const ContentModelFormPreviewFeature = createFeature({
    name: "CmsContentModelEditor/FormPreview",
    register(container) {
        container.register(ContentModelFormPreviewPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(ContentModelFormPreviewPresenter)
        };
    }
});
