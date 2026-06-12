import { createFeature } from "@webiny/feature/admin";
import { PageListPresenter } from "./abstractions.js";
import { PageListPresenterImplementation } from "./PageListPresenter.js";

export const PageListPresenterFeature = createFeature({
    name: "WebsiteBuilder/PageListPresenter",
    register(container) {
        container.register(PageListPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PageListPresenter)
        };
    }
});
