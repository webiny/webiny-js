import { createFeature } from "@webiny/feature/admin";
import { ModelGroupPresenter } from "./abstractions.js";
import { ModelGroupPresenterImplementation } from "./ModelGroupPresenter.js";

export const ModelGroupPresenterFeature = createFeature({
    name: "CmsModelGroup/Presenter",
    register(container) {
        container.register(ModelGroupPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(ModelGroupPresenter)
        };
    }
});
