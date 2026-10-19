import { createFeature } from "@webiny/feature/api";
import { ListAdminExtensionsUseCase } from "./ListAdminExtensionsUseCase.js";
import { ListAdminExtensionsRepository } from "./ListAdminExtensionsRepository.js";

export const ListAdminExtensionsFeature = createFeature({
    name: "RemoteComponents/ListAdminExtensions",
    register(container) {
        container.register(ListAdminExtensionsUseCase);
        container.register(ListAdminExtensionsRepository).inSingletonScope();
    }
});
