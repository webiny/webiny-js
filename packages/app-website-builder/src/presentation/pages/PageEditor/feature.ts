import { createFeature } from "@webiny/feature/admin";
import { PageEditorPresenter as PresenterAbstraction } from "./abstractions.js";
import { PageEditorPresenterRegistration } from "./PageEditorPresenter.js";

export const PageEditorFeature = createFeature({
    name: "WebsiteBuilder/PageEditor",
    register(container) {
        // Not a singleton: each open page editor loads its own page.
        container.register(PageEditorPresenterRegistration);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
