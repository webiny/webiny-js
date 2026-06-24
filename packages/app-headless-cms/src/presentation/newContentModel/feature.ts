import { createFeature } from "@webiny/feature/admin";
import { NewContentModelPresenter } from "./abstractions.js";
import { NewContentModelPresenterImplementation } from "./NewContentModelPresenter.js";

export const NewContentModelPresenterFeature = createFeature({
    name: "CmsNewContentModel/Presenter",
    register(container) {
        container.register(NewContentModelPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(NewContentModelPresenter)
        };
    }
});
