import { createFeature } from "@webiny/feature/admin";
import { CreateRedirectPresenter as Abstraction } from "./abstractions.js";
import { CreateRedirectPresenter } from "./CreateRedirectPresenter.js";

export const CreateRedirectPresenterFeature = createFeature({
    name: "WebsiteBuilder/CreateRedirectPresenter",
    register(container) {
        container.register(CreateRedirectPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
