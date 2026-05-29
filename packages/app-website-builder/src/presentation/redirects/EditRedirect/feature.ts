import { createFeature } from "@webiny/feature/admin";
import { EditRedirectPresenter as Abstraction } from "./abstractions.js";
import { EditRedirectPresenter } from "./EditRedirectPresenter.js";

export const EditRedirectPresenterFeature = createFeature({
    name: "WebsiteBuilder/EditRedirectPresenter",
    register(container) {
        container.register(EditRedirectPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
