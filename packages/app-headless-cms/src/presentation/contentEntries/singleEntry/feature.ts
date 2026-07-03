import { createFeature } from "@webiny/feature/admin";
import { SingleEntryPresenter as Abstraction } from "./abstractions.js";
import { SingleEntryPresenter } from "./SingleEntryPresenter.js";

export const SingleEntryPresenterFeature = createFeature({
    name: "CmsContentEntries/SingleEntryPresenter",
    register(container) {
        container.register(SingleEntryPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
