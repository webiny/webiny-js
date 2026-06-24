import { createFeature } from "@webiny/feature/admin";
import { CloneContentModelPresenter } from "./abstractions.js";
import { CloneContentModelPresenterImplementation } from "./CloneContentModelPresenter.js";

export const CloneContentModelPresenterFeature = createFeature({
    name: "CmsCloneContentModel/Presenter",
    register(container) {
        container.register(CloneContentModelPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(CloneContentModelPresenter)
        };
    }
});
