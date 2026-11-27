import { createFeature } from "@webiny/feature/admin";
import { PromptContextPresenter } from "./abstractions.js";
import { PromptContextPresenterImplementation } from "./PromptContextPresenter.js";

export const PromptContextFeature = createFeature({
    name: "WbAssistant/PromptContext",
    register(container) {
        // One for the admin, so the choice carries from one page's editor to the next.
        container.register(PromptContextPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return { promptContext: container.resolve(PromptContextPresenter) };
    }
});
