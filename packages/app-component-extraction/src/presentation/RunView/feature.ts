import { createFeature } from "@webiny/feature/admin";
import { RunViewPresenter as PresenterAbstraction } from "./abstractions.js";
import { RunViewPresenter } from "./RunViewPresenter.js";

export const RunViewFeature = createFeature({
    name: "ComponentExtraction/RunView",
    register(container) {
        container.register(RunViewPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
