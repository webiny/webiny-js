import { createFeature } from "@webiny/feature/admin";
import { ExperimentFormPresenter as PresenterAbstraction } from "./abstractions/ExperimentFormPresenter.js";
import { ExperimentFormPresenter } from "./ExperimentFormPresenter.js";

export const ExperimentFormPresenterFeature = createFeature({
    name: "WebsiteBuilder/ExperimentFormPresenter",
    register(container) {
        container.register(ExperimentFormPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
