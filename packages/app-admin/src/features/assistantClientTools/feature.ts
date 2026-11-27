import { createFeature } from "@webiny/feature/admin";
import { AssistantClientTools } from "./AssistantClientTools.js";
import { AssistantClientTools as Abstraction } from "./abstractions.js";

export const AssistantClientToolsFeature = createFeature({
    name: "AssistantClientTools",
    register(container) {
        // Singleton: the screen that registers tools and the assistant that runs them share one.
        container.register(AssistantClientTools).inSingletonScope();
    },
    resolve(container) {
        return { clientTools: container.resolve(Abstraction) };
    }
});
