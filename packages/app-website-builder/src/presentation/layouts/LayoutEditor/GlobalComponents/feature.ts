import { createFeature } from "@webiny/feature/admin";
import { LayoutGlobalComponentsPresenter as PresenterAbstraction } from "./abstractions.js";
import { LayoutGlobalComponentsPresenterRegistration } from "./LayoutGlobalComponentsPresenter.js";

export const LayoutGlobalComponentsFeature = createFeature({
    name: "LayoutEditor/GlobalComponents",
    register(container) {
        // One instance, shared by the loader, the autosave and the save bar of the open layout.
        container.register(LayoutGlobalComponentsPresenterRegistration).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
