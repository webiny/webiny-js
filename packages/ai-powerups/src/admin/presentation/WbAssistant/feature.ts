import { createFeature } from "@webiny/feature/admin";
import { PageEditorAssistantConnector } from "./abstractions.js";
import { PageEditorAssistantConnectorImplementation } from "./PageEditorAssistantConnector.js";

export const PageEditorAssistantFeature = createFeature({
    name: "WbAssistant/PageEditor",
    register(container) {
        // One for the editor: its panel and its overlay reach the same connection.
        container.register(PageEditorAssistantConnectorImplementation).inSingletonScope();
    },
    resolve(container) {
        return { connector: container.resolve(PageEditorAssistantConnector) };
    }
});
