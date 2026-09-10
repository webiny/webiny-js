import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { DocsExplorerPresenter } from "./abstractions.js";
import { DefaultDocsExplorerPresenter } from "./DocsExplorerPresenter.js";

export const DocsExplorerFeature = createFeature({
    name: "DocsExplorerPresenter",
    register(container) {
        container.register(DefaultDocsExplorerPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(DocsExplorerPresenter)
        };
    }
});
