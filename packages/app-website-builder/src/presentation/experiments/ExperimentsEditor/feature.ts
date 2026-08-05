import { createFeature } from "@webiny/feature/admin";
import { ExperimentsFeature } from "~/features/experiments/index.js";
import { ExperimentsEditorPresenter as PresenterAbstraction } from "./abstractions/ExperimentsEditorPresenter.js";
import { ExperimentsEditorPresenter } from "./ExperimentsEditorPresenter.js";
import { ExperimentsEditorDataSource } from "./ExperimentsEditorDataSource.js";

export const ExperimentsEditorPresenterFeature = createFeature({
    name: "WebsiteBuilder/ExperimentsEditorPresenter",
    register(container) {
        ExperimentsFeature.register(container);
        container.register(ExperimentsEditorDataSource).inSingletonScope();
        container.register(ExperimentsEditorPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
