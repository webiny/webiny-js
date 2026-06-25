import { createFeature } from "@webiny/feature/admin";
import { PageListPresenter as Abstraction } from "./abstractions.js";
import { PageListPresenter } from "./PageListPresenter.js";

export const PageListPresenterFeature = createFeature({
    name: "WebsiteBuilder/PageListPresenter",
    register(container) {
        container.register(PageListPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
