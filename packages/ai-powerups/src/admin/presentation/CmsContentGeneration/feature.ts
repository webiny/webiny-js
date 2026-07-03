import { createFeature } from "@webiny/feature/admin";
import { CmsGenerateContentPresenter as Abstraction } from "./abstractions.js";
import { CmsGenerateContentPresenter } from "./CmsGenerateContentPresenter.js";

export const CmsGenerateContentFeature = createFeature({
    name: "CmsContentGeneration/Presenter",
    register(container) {
        container.register(CmsGenerateContentPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
