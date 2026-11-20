import { createFeature } from "@webiny/feature/admin";
import { PageGlobalComponentsPresenter as PresenterAbstraction } from "./abstractions.js";
import { PageGlobalComponentsPresenterRegistration } from "./PageGlobalComponentsPresenter.js";

export const PageGlobalComponentsFeature = createFeature({
    name: "PageEditor/GlobalComponents",
    register(container) {
        // One instance, shared by the loader and the save bar of the open page.
        container.register(PageGlobalComponentsPresenterRegistration).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
