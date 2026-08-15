import { createFeature } from "@webiny/feature/admin";
import { JobDetailPresenter as PresenterAbstraction } from "./abstractions.js";
import { JobDetailPresenter } from "./JobDetailPresenter.js";

export const JobDetailFeature = createFeature({
    name: "ComponentExtraction/JobDetail",
    register(container) {
        container.register(JobDetailPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
