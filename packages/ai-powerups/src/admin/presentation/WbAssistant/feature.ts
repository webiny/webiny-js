import { createFeature } from "@webiny/feature/admin";
import { PageEditorAssistantPresenter } from "./abstractions.js";
import { PageEditorAssistantPresenterImplementation } from "./PageEditorAssistantPresenter.js";

export const PageEditorAssistantFeature = createFeature({
    name: "WbAssistant/PageEditor",
    register(container) {
        // One for the editor: its panel and its overlay reach the same connection.
        container.register(PageEditorAssistantPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PageEditorAssistantPresenter) };
    }
});
