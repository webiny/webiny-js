import { createFeature } from "@webiny/feature/admin";
import { SingletonEntryPresenter } from "./abstractions.js";
import { SingletonEntryPresenterImplementation } from "./SingletonEntryPresenter.js";

export const SingletonEntryPresenterFeature = createFeature({
    name: "CmsContentEntries/SingletonPresenter",
    register(container) {
        container.register(SingletonEntryPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(SingletonEntryPresenter)
        };
    }
});
