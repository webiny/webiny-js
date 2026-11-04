import { createFeature } from "@webiny/feature/admin";
import { LayoutsListPresenter as PresenterAbstraction } from "./abstractions.js";
import { LayoutsListPresenterRegistration } from "./LayoutsListPresenter.js";

export const LayoutsListFeature = createFeature({
    name: "WebsiteBuilder/LayoutsList",
    register(container) {
        container.register(LayoutsListPresenterRegistration).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
