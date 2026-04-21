import { createFeature } from "@webiny/feature/admin";
import { AiPowerUpsSettingsPresenter as PresenterAbstraction } from "./abstractions.js";
import { AiPowerUpsSettingsPresenter } from "./AiPowerUpsSettingsPresenter.js";
import { ProviderSettings } from "../ProvidersSettings.js";
import { PersonasSettings } from "../PersonasSettings.js";

export const AiPowerUpsSettingsFeature = createFeature({
    name: "AiPowerUps/Settings/Presenter",
    register(container) {
        container.register(ProviderSettings);
        container.register(PersonasSettings);
        container.register(AiPowerUpsSettingsPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
