import { createFeature } from "@webiny/feature/api";
import CapabilitiesHandler from "./CapabilitiesHandler.js";
import { ResolveAiCapabilityUseCaseImplementation } from "./ResolveAiCapabilityUseCase.js";

export const CapabilitiesFeature = createFeature({
    name: "AiPowerUpsCapabilities",
    register(container) {
        container.register(CapabilitiesHandler);
        container.register(ResolveAiCapabilityUseCaseImplementation);
    }
});
