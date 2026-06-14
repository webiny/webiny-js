import { createFeature } from "@webiny/feature/admin";
import { SettingsPresenter } from "./abstractions.js";
import { SettingsPresenterImplementation } from "./SettingsPresenter.js";

export const SettingsPresenterFeature = createFeature({
    name: "Mailer/SettingsPresenter",
    register(container) {
        container.register(SettingsPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(SettingsPresenter)
        };
    }
});
