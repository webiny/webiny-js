import { createFeature } from "@webiny/feature/admin";
import { RefDialogPresenter } from "./abstractions.js";
import { RefDialogPresenterImplementation } from "./RefDialogPresenter.js";

export const RefDialogPresenterFeature = createFeature({
    name: "CmsRefField/DialogPresenter",
    register(container) {
        container.register(RefDialogPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(RefDialogPresenter)
        };
    }
});
