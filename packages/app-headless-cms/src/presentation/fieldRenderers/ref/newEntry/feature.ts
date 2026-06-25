import { createFeature } from "@webiny/feature/admin";
import { NewEntryPresenter as Abstraction } from "./abstractions.js";
import { NewEntryPresenter } from "./NewEntryPresenter.js";

export const NewEntryPresenterFeature = createFeature({
    name: "CmsRefField/NewEntryPresenter",
    register(container) {
        container.register(NewEntryPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
