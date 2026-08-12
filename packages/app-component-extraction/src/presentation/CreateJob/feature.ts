import { createFeature } from "@webiny/feature/admin";
import { CreateJobPresenter as PresenterAbstraction } from "./abstractions.js";
import { CreateJobPresenter } from "./CreateJobPresenter.js";

export const CreateJobFeature = createFeature({
    name: "ComponentExtraction/CreateJob",
    register(container) {
        container.register(CreateJobPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
