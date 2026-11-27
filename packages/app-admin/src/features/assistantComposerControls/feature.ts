import { createFeature } from "@webiny/feature/admin";
import { AssistantComposerControls } from "./AssistantComposerControls.js";
import { AssistantComposerControls as Abstraction } from "./abstractions.js";

export const AssistantComposerControlsFeature = createFeature({
    name: "AssistantComposerControls",
    register(container) {
        // Singleton: the screen that adds controls and the composer that shows them share one.
        container.register(AssistantComposerControls).inSingletonScope();
    },
    resolve(container) {
        return { composerControls: container.resolve(Abstraction) };
    }
});
