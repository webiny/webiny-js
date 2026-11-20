import { createFeature } from "@webiny/feature/admin";
import { LayoutRevisionsPresenter as PresenterAbstraction } from "./abstractions.js";
import { LayoutRevisionsPresenterRegistration } from "./LayoutRevisionsPresenter.js";

export const LayoutRevisionsFeature = createFeature({
    name: "WebsiteBuilder/LayoutEditor/Revisions",
    register(container) {
        // One instance, shared by the top bar menu, the buttons and the revisions drawer.
        container.register(LayoutRevisionsPresenterRegistration).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
