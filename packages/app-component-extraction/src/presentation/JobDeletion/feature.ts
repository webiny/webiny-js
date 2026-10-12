import { createFeature } from "@webiny/feature/admin";
import { JobDeletionPresenter as PresenterAbstraction } from "./abstractions.js";
import { JobDeletionPresenterImplementation } from "./JobDeletionPresenter.js";

export const JobDeletionFeature = createFeature({
    name: "ComponentExtraction/JobDeletion",
    register(container) {
        container.register(JobDeletionPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
