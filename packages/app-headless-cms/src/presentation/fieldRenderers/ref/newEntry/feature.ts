import { createFeature } from "@webiny/feature/admin";
import { NewEntryPresenter } from "./abstractions.js";
import { NewEntryPresenterImplementation } from "./NewEntryPresenter.js";

export const NewEntryPresenterFeature = createFeature({
    name: "CmsRefField/NewEntryPresenter",
    register(container) {
        container.register(NewEntryPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(NewEntryPresenter)
        };
    }
});
