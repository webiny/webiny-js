import { createFeature } from "@webiny/feature/admin";
import { SettingsPresenter as Abstraction } from "./abstractions.js";
import { SettingsPresenter } from "./SettingsPresenter.js";

export const SettingsPresenterFeature = createFeature({
    name: "Mailer/SettingsPresenter",
    register(container) {
        container.register(SettingsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
