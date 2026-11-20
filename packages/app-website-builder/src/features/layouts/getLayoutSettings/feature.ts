import { createFeature } from "@webiny/feature/admin";
import { GetLayoutSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetLayoutSettingsUseCase } from "./GetLayoutSettingsUseCase.js";

export const GetLayoutSettingsFeature = createFeature({
    name: "WebsiteBuilder/GetLayoutSettings",
    register(container) {
        container.register(GetLayoutSettingsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
