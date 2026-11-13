import { createFeature } from "@webiny/feature/admin";
import { AssistantPageContext } from "./AssistantPageContext.js";
import { AssistantPageContext as Abstraction } from "./abstractions.js";

export const AssistantPageContextFeature = createFeature({
    name: "AssistantPageContext",
    register(container) {
        // Singleton: the view that sets it and the assistant that reads it must share one.
        container.register(AssistantPageContext).inSingletonScope();
    },
    resolve(container) {
        return { pageContext: container.resolve(Abstraction) };
    }
});
