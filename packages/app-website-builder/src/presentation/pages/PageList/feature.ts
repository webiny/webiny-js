import { createFeature } from "@webiny/feature/admin";
import { PageListPresenter } from "./abstractions.js";
import { DocumentListPresenter } from "./DocumentListPresenter.js";

export const PageListFeature = createFeature({
    name: "PageListFeature",
    register(container) {
        container.registerInstance(PageListPresenter, new DocumentListPresenter());
    },
    resolve(container) {
        return { presenter: container.resolve(PageListPresenter) };
    }
});
