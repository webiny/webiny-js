import { createFeature } from "@webiny/feature/admin";
import { ExclusionDialogPresenter as Abstraction } from "./abstractions.js";
import { ExclusionDialogPresenter } from "./ExclusionDialogPresenter.js";

// Transient (R212): every dialog host gets its own presenter.
export const ExclusionDialogPresenterFeature = createFeature({
    name: "Workflows/ExclusionDialogPresenter",
    register(container) {
        container.register(ExclusionDialogPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
