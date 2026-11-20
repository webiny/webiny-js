import { createFeature } from "@webiny/feature/admin";
import { ElementSidebarPresenter as PresenterAbstraction } from "./abstractions.js";
import { ElementSidebarPresenterRegistration } from "./ElementSidebarPresenter.js";

export const ElementSidebarFeature = createFeature({
    name: "BaseEditor/ElementSidebar",
    register(container) {
        // Not a singleton: each open editor's sidebar describes its own document's selected element.
        container.register(ElementSidebarPresenterRegistration);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
