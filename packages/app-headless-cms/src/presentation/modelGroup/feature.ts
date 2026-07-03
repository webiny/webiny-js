import { createFeature } from "@webiny/feature/admin";
import { ModelGroupPresenter as Abstraction } from "./abstractions.js";
import { ModelGroupPresenter } from "./ModelGroupPresenter.js";

export const ModelGroupPresenterFeature = createFeature({
    name: "CmsModelGroup/Presenter",
    register(container) {
        container.register(ModelGroupPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
