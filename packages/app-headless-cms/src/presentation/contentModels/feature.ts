import { createFeature } from "@webiny/feature/admin";
import { ContentModelsPresenter as Abstraction } from "./abstractions.js";
import { ContentModelsPresenter } from "./ContentModelsPresenter.js";

export const ContentModelsPresenterFeature = createFeature({
    name: "CmsContentModels/Presenter",
    register(container) {
        container.register(ContentModelsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
