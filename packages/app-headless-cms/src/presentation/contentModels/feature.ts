import { createFeature } from "@webiny/feature/admin";
import { ContentModelsPresenter } from "./abstractions.js";
import { ContentModelsPresenterImplementation } from "./ContentModelsPresenter.js";

export const ContentModelsPresenterFeature = createFeature({
    name: "CmsContentModels/Presenter",
    register(container) {
        container.register(ContentModelsPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(ContentModelsPresenter)
        };
    }
});
