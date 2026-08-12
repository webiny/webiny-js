import { createFeature } from "@webiny/feature/admin";
import { ExtractionListPresenter as PresenterAbstraction } from "./abstractions.js";
import { ExtractionListPresenter } from "./ExtractionListPresenter.js";

export const ExtractionListFeature = createFeature({
    name: "ComponentExtraction/ExtractionList",
    register(container) {
        container.register(ExtractionListPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
