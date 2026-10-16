import { createFeature } from "@webiny/feature/admin";
import { ReassignDialogPresenter as Abstraction } from "./reassignAbstractions.js";
import { ReassignDialogPresenter } from "./ReassignDialogPresenter.js";

export const ReassignDialogPresenterFeature = createFeature({
    name: "Workflows/ReassignDialogPresenter",
    register(container) {
        // Transient (R212): one instance, and one private picker, per mounted dialog.
        container.register(ReassignDialogPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
