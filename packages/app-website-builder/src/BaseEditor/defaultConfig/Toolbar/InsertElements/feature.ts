import { createFeature } from "@webiny/feature/admin";
import { InsertElementsPresenter as PresenterAbstraction } from "./abstractions.js";
import { InsertElementsPresenterRegistration } from "./InsertElementsPresenter.js";

export const InsertElementsFeature = createFeature({
    name: "WebsiteBuilder/Editor/InsertElements",
    register(container) {
        // Not a singleton: each open editor's Insert panel lists its own document's components.
        container.register(InsertElementsPresenterRegistration);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
