import { createFeature } from "@webiny/feature/api";
import CapabilitiesHandler from "./CapabilitiesHandler.js";
import { ResolveAiCapabilityUseCaseImplementation } from "./ResolveAiCapabilityUseCase.js";
import { ListAiCapabilitiesUseCaseImplementation } from "./ListAiCapabilitiesUseCase.js";

export const CapabilitiesFeature = createFeature({
    name: "AiPowerUpsCapabilities",
    register(container) {
        container.register(CapabilitiesHandler);
        container.register(ResolveAiCapabilityUseCaseImplementation);
        container.register(ListAiCapabilitiesUseCaseImplementation);
    }
});
