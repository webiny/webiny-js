import { createFeature } from "@webiny/feature/api";
import { DeleteAdminExtensionUseCase } from "./DeleteAdminExtensionUseCase.js";
import { DeleteAdminExtensionRepository } from "./DeleteAdminExtensionRepository.js";

export const DeleteAdminExtensionFeature = createFeature({
    name: "RemoteComponents/DeleteAdminExtension",
    register(container) {
        container.register(DeleteAdminExtensionUseCase);
        container.register(DeleteAdminExtensionRepository).inSingletonScope();
    }
});
