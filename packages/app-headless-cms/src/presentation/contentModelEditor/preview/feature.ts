import { createFeature } from "@webiny/feature/admin";
import { ContentModelFormPreviewPresenter as Abstraction } from "./abstractions.js";
import { ContentModelFormPreviewPresenter } from "./ContentModelFormPreviewPresenter.js";

export const ContentModelFormPreviewFeature = createFeature({
    name: "CmsContentModelEditor/FormPreview",
    register(container) {
        container.register(ContentModelFormPreviewPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
