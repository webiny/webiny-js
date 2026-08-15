import { createFeature } from "@webiny/feature/admin";
import { RunInspectorPresenter as PresenterAbstraction } from "./abstractions.js";
import { RunInspectorPresenter } from "./RunInspectorPresenter.js";

export const RunInspectorFeature = createFeature({
    name: "ComponentExtraction/RunInspector",
    register(container) {
        container.register(RunInspectorPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
