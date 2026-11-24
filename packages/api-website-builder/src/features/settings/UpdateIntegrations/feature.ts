import { createFeature } from "@webiny/feature/api";
import { UpdateIntegrationsUseCase } from "./UpdateIntegrationsUseCase.js";

export const UpdateIntegrationsFeature = createFeature({
    name: "WebsiteBuilder/UpdateIntegrations",
    register(container) {
        container.register(UpdateIntegrationsUseCase);
    }
});
