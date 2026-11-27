import { createFeature } from "@webiny/feature/admin";
import { SingletonEditorPresenter as Abstraction } from "./abstractions.js";
import { SingletonEditorPresenter } from "./SingletonEditorPresenter.js";

export const SingletonEditorPresenterFeature = createFeature({
    name: "CmsContentEntries/SingletonEditorPresenter",
    register(container) {
        container.register(SingletonEditorPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
