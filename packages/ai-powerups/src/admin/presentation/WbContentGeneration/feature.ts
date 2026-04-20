import { createFeature } from "@webiny/feature/admin";
import { GenerateContentPresenter } from "./abstractions.js";
import { GenerateContentPresenterRegistration } from "./GenerateContentPresenter.js";

export const GenerateContentFeature = createFeature({
    name: "WbContentGeneration/Presenter",
    register(container) {
        container.register(GenerateContentPresenterRegistration);
    },
    resolve(container) {
        return {
            presenter: container.resolve(GenerateContentPresenter)
        };
    }
});
