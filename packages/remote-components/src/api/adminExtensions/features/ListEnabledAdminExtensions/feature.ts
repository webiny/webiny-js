import { createFeature } from "@webiny/feature/api";
import { ListEnabledAdminExtensionsUseCase } from "./ListEnabledAdminExtensionsUseCase.js";

export const ListEnabledAdminExtensionsFeature = createFeature({
    name: "RemoteComponents/ListEnabledAdminExtensions",
    register(container) {
        container.register(ListEnabledAdminExtensionsUseCase);
    }
});
