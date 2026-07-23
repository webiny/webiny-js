import { createFeature } from "webiny/admin";
import { CompareRevisionsPresenter } from "./abstractions.js";
import { CompareRevisionsPresenterImplementation } from "./CompareRevisionsPresenter.js";

export const CompareRevisionsPresentationFeature = createFeature({
    name: "CmsRevisionCompare/Presentation",
    register(container) {
        container.register(CompareRevisionsPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(CompareRevisionsPresenter)
        };
    }
});
