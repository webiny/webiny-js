import { createFeature } from "@webiny/feature/admin";
import { AiPowerUpsSettingsPresenter as PresenterAbstraction } from "./abstractions.js";
import { AiPowerUpsSettingsPresenter } from "./AiPowerUpsSettingsPresenter.js";
import { ProviderSettings } from "../ProvidersSettings.js";
import { ReaderPersonasSettings } from "../ReaderPersonasSettings.js";
import { WriterPersonasSettings } from "../WriterPersonasSettings.js";

export const AiPowerUpsSettingsFeature = createFeature({
    name: "AiPowerUps/Settings/Presenter",
    register(container) {
        container.register(ProviderSettings);
        container.register(ReaderPersonasSettings);
        container.register(WriterPersonasSettings);
        container.register(AiPowerUpsSettingsPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
