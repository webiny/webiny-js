import { createFeature } from "@webiny/feature/api";
import { GetIntegrationsUseCase } from "./GetIntegrationsUseCase.js";

export const GetIntegrationsFeature = createFeature({
    name: "WebsiteBuilder/GetIntegrations",
    register(container) {
        container.register(GetIntegrationsUseCase);
    }
});
