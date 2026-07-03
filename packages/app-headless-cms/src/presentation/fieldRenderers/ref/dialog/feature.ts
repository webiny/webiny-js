import { createFeature } from "@webiny/feature/admin";
import { RefDialogPresenter as Abstraction } from "./abstractions.js";
import { RefDialogPresenter } from "./RefDialogPresenter.js";

export const RefDialogPresenterFeature = createFeature({
    name: "CmsRefField/DialogPresenter",
    register(container) {
        container.register(RefDialogPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
