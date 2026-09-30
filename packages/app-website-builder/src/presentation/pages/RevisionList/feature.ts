import { createFeature } from "@webiny/feature/admin";
import { RevisionListPresenter as PresenterAbstraction } from "./abstractions.js";
import { RevisionListPresenter } from "./RevisionListPresenter.js";

export const RevisionListFeature = createFeature({
    name: "WebsiteBuilder/RevisionList",
    register(container) {
        container.register(RevisionListPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
