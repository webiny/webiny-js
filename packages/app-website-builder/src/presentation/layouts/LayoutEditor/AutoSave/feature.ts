import { createFeature } from "@webiny/feature/admin";
import { LayoutAutoSavePresenter as PresenterAbstraction } from "./abstractions.js";
import { LayoutAutoSavePresenterRegistration } from "./LayoutAutoSavePresenter.js";

export const LayoutAutoSaveFeature = createFeature({
    name: "WebsiteBuilder/LayoutEditor/AutoSave",
    register(container) {
        // Not a singleton: each open layout editor saves its own layout.
        container.register(LayoutAutoSavePresenterRegistration);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
