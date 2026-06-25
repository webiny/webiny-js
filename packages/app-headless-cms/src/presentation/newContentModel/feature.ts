import { createFeature } from "@webiny/feature/admin";
import { NewContentModelPresenter as Abstraction } from "./abstractions.js";
import { NewContentModelPresenter } from "./NewContentModelPresenter.js";

export const NewContentModelPresenterFeature = createFeature({
    name: "CmsNewContentModel/Presenter",
    register(container) {
        container.register(NewContentModelPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
