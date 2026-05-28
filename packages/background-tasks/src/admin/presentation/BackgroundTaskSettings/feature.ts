import { createFeature } from "@webiny/feature/admin";
import { BackgroundTaskSettingsPresenter as PresenterAbstraction } from "./abstractions.js";
import { BackgroundTaskSettingsPresenter } from "./BackgroundTaskSettingsPresenter.js";

export const BackgroundTaskSettingsPresenterFeature = createFeature({
    name: "BackgroundTasks/BackgroundTaskSettingsPresenter",
    register(container) {
        container.register(BackgroundTaskSettingsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
