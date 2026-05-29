import { createFeature } from "@webiny/feature/admin";
import { RedirectListPresenter as Abstraction } from "./abstractions.js";
import { RedirectListPresenter } from "./RedirectListPresenter.js";

export const RedirectListPresenterFeature = createFeature({
    name: "WebsiteBuilder/RedirectListPresenter",
    register(container) {
        container.register(RedirectListPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
