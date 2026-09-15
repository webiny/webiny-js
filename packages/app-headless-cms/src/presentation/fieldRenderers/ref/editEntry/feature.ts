import { createFeature } from "@webiny/feature/admin";
import { EditEntryPresenter as Abstraction } from "./abstractions.js";
import { EditEntryPresenter } from "./EditEntryPresenter.js";

export const EditEntryPresenterFeature = createFeature({
    name: "CmsRefField/EditEntryPresenter",
    register(container) {
        container.register(EditEntryPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
