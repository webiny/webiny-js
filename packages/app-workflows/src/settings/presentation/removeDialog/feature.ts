import { createFeature } from "@webiny/feature/admin";
import { RemoveExclusionDialogPresenter as Abstraction } from "./abstractions.js";
import { RemoveExclusionDialogPresenter } from "./RemoveExclusionDialogPresenter.js";

// Transient (R212): every dialog host gets its own presenter.
export const RemoveExclusionDialogPresenterFeature = createFeature({
    name: "Workflows/RemoveExclusionDialogPresenter",
    register(container) {
        container.register(RemoveExclusionDialogPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
