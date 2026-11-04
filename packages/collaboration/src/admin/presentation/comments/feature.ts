import { createFeature } from "@webiny/feature/admin";
import { CommentsPresenter as PresenterAbstraction } from "./abstractions.js";
import { CommentsPresenter } from "./CommentsPresenter.js";

export const CommentsPresenterFeature = createFeature({
    name: "Collaboration/CommentsPresenter",
    register(container) {
        container.register(CommentsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
