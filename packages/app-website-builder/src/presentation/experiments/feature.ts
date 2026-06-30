import { createFeature } from "@webiny/feature/admin";
import { ExperimentsPresenter as PresenterAbstraction } from "./abstractions.js";
import { ExperimentsPresenter } from "./ExperimentsPresenter.js";

export const ExperimentsPresentationFeature = createFeature({
    name: "WebsiteBuilder/ExperimentsPresentation",
    register(container) {
        container.register(ExperimentsPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
