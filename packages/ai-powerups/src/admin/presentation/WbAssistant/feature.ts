import { createFeature } from "@webiny/feature/admin";
import { PageEditorAssistantPresenter } from "./abstractions.js";
import { PageEditorAssistantPresenterImplementation } from "./PageEditorAssistantPresenter.js";

export const PageEditorAssistantFeature = createFeature({
    name: "WbAssistant/PageEditor",
    register(container) {
        container.register(PageEditorAssistantPresenterImplementation);
    },
    resolve(container) {
        return { presenter: container.resolve(PageEditorAssistantPresenter) };
    }
});
