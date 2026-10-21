import { createFeature } from "@webiny/feature/admin";
import { ExclusionsPagePresenter as Abstraction } from "./abstractions.js";
import { ExclusionsPagePresenter } from "./ExclusionsPagePresenter.js";

// Transient (R212): every `useFeature` resolve is a new presenter, so views never share state.
export const ExclusionsPagePresenterFeature = createFeature({
    name: "Workflows/ExclusionsPagePresenter",
    register(container) {
        container.register(ExclusionsPagePresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
