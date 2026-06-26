import { createFeature } from "@webiny/feature/admin";
import { CloneContentModelPresenter as Abstraction } from "./abstractions.js";
import { CloneContentModelPresenter } from "./CloneContentModelPresenter.js";

export const CloneContentModelPresenterFeature = createFeature({
    name: "CmsCloneContentModel/Presenter",
    register(container) {
        container.register(CloneContentModelPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
