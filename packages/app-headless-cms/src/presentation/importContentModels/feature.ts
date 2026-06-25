import { createFeature } from "@webiny/feature/admin";
import { ImportContentModelsPresenter as Abstraction } from "./abstractions.js";
import { ImportContentModelsPresenter } from "./ImportContentModelsPresenter.js";

export const ImportContentModelsPresenterFeature = createFeature({
    name: "CmsImportContentModels/Presenter",
    register(container) {
        container.register(ImportContentModelsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
