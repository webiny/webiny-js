import { createFeature } from "@webiny/feature/admin";
import { FolderTreePresenter as Abstraction } from "./abstractions.js";
import { FolderTreePresenter } from "./FolderTreePresenter.js";

export const FolderTreePresenterFeature = createFeature({
    name: "FolderTreePresenter",
    register(container) {
        container.register(FolderTreePresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
