import { createFeature } from "@webiny/feature/admin";
import { AiPowerUpsSettingsPresenter as PresenterAbstraction } from "./abstractions.js";
import { AiPowerUpsSettingsPresenter } from "./AiPowerUpsSettingsPresenter.js";
import { ListModelsFeature } from "../features/listModels/index.js";
import { GeneralSettingsGroup } from "../groups/GeneralSettingsGroup.js";

export const AiPowerUpsSettingsFeature = createFeature({
    name: "AiPowerUps/Settings/Presenter",
    register(container) {
        ListModelsFeature.register(container);
        container.register(GeneralSettingsGroup);
        container.register(AiPowerUpsSettingsPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
