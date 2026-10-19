import { createFeature } from "@webiny/feature/api";
import { SetAdminExtensionEnabledUseCase } from "./SetAdminExtensionEnabledUseCase.js";
import { SetAdminExtensionEnabledRepository } from "./SetAdminExtensionEnabledRepository.js";

export const SetAdminExtensionEnabledFeature = createFeature({
    name: "RemoteComponents/SetAdminExtensionEnabled",
    register(container) {
        container.register(SetAdminExtensionEnabledUseCase);
        container.register(SetAdminExtensionEnabledRepository).inSingletonScope();
    }
});
