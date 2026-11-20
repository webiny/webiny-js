import { createFeature } from "@webiny/feature/admin";
import { PageLayoutSettings } from "./PageLayoutSettings.js";
import { PageLayoutPresenter as PresenterAbstraction } from "./abstractions.js";
import { PageLayoutPresenterRegistration } from "./PageLayoutPresenter.js";

export const PageLayoutFeature = createFeature({
    name: "PageEditor/PageLayout",
    register(container) {
        container.register(PageLayoutSettings);
        container.register(PageLayoutPresenterRegistration);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
