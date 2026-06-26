import { createFeature } from "@webiny/feature/admin";
import { ContentGroupsMenuPresenter as Abstraction } from "./abstractions.js";
import { ContentGroupsMenuPresenter } from "./ContentGroupsMenuPresenter.js";

export const ContentGroupsMenuPresenterFeature = createFeature({
    name: "CmsContentGroupsMenu/Presenter",
    register(container) {
        container.register(ContentGroupsMenuPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
