import { createFeature } from "@webiny/feature/api";
import { CreateAdminExtensionUseCase } from "./CreateAdminExtensionUseCase.js";
import { CreateAdminExtensionRepository } from "./CreateAdminExtensionRepository.js";

export const CreateAdminExtensionFeature = createFeature({
    name: "RemoteComponents/CreateAdminExtension",
    register(container) {
        container.register(CreateAdminExtensionUseCase);
        container.register(CreateAdminExtensionRepository).inSingletonScope();
    }
});
