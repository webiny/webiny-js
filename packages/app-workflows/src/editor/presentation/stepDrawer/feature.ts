import { createFeature } from "@webiny/feature/admin";
import { StepDrawerPresenter as Abstraction } from "./abstractions.js";
import { StepDrawerPresenter } from "./StepDrawerPresenter.js";

export const StepDrawerPresenterFeature = createFeature({
    name: "Workflows/Editor/StepDrawerPresenter",
    register(container) {
        // A singleton, so the container keeps one drawer state; `dispose` resets it (`StepDrawer` calls it on unmount).
        container.register(StepDrawerPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
