import { createFeature } from "@webiny/feature/admin";
import { JobAssignmentPresenter as PresenterAbstraction } from "./abstractions.js";
import { JobAssignmentPresenterImplementation } from "./JobAssignmentPresenter.js";

export const JobAssignmentFeature = createFeature({
    name: "ComponentExtraction/JobAssignment",
    register(container) {
        container.register(JobAssignmentPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
