import { createFeature } from "@webiny/feature/admin";
import { ExperimentsManagerPresenter as PresenterAbstraction } from "./abstractions/ExperimentsManagerPresenter.js";
import { ExperimentsManagerPresenter } from "./ExperimentsManagerPresenter.js";

export const ExperimentsManagerPresenterFeature = createFeature({
    name: "WebsiteBuilder/ExperimentsManagerPresenter",
    register(container) {
        // The editor hub presenter (ExperimentsEditorPresenterFeature) is registered app/editor-wide
        // and resolved through the container's parent chain — the manager delegates to that same
        // singleton so drawer open/edit triggered from the editor toolbar are observed here.
        container.register(ExperimentsManagerPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
