import { createFeature } from "@webiny/feature/admin";
import { RedirectListPresenter as Abstraction } from "./abstractions.js";
import { RedirectListPresenter } from "./RedirectListPresenter.js";
import { CreateRedirectPresenter } from "./CreateRedirectPresenter.js";
import { EditRedirectPresenter } from "./EditRedirectPresenter.js";

export const RedirectListPresenterFeature = createFeature({
    name: "WebsiteBuilder/RedirectListPresenter",
    register(container) {
        container.register(RedirectListPresenter).inSingletonScope();
        container.register(CreateRedirectPresenter).inSingletonScope();
        container.register(EditRedirectPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
