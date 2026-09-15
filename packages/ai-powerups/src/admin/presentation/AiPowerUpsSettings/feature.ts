import { createFeature } from "@webiny/feature/admin";
import { AiPowerUpsSettingsPresenter as PresenterAbstraction } from "./abstractions.js";
import { AiPowerUpsSettingsPresenter } from "./AiPowerUpsSettingsPresenter.js";
import { ConnectionsSettings } from "../ConnectionsSettings.js";
import { ModelRolesSettings } from "../ModelRolesSettings.js";
import { CapabilitiesSettings } from "../CapabilitiesSettings.js";
import { ReaderPersonasSettings } from "../ReaderPersonasSettings.js";
import { WriterPersonasSettings } from "../WriterPersonasSettings.js";
import { ProjectsSettings } from "../ProjectsSettings.js";

export const AiPowerUpsSettingsFeature = createFeature({
    name: "AiPowerUps/Settings/Presenter",
    register(container) {
        /*
         * Registration order is tab order. Configuration first (a key, then what each role runs,
         * then per-feature exceptions), then the prompt content: personas and projects.
         *
         * `ProvidersSettings` is gone from the UI. Its stored section still round-trips on the api
         * so `Connections` and `ModelRoles` can seed themselves from it once.
         */
        container.register(ConnectionsSettings);
        container.register(ModelRolesSettings);
        container.register(CapabilitiesSettings);
        container.register(ReaderPersonasSettings);
        container.register(WriterPersonasSettings);
        container.register(ProjectsSettings);
        container.register(AiPowerUpsSettingsPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
