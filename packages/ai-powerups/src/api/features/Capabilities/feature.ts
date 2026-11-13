import { createFeature } from "@webiny/feature/api";
import CapabilitiesHandler from "./CapabilitiesHandler.js";
import ResolveAiCapabilityUseCase from "./ResolveAiCapabilityUseCase.js";
import ListAiCapabilitiesUseCase from "./ListAiCapabilitiesUseCase.js";

export const CapabilitiesFeature = createFeature({
    name: "AiPowerUpsCapabilities",
    register(container) {
        container.register(CapabilitiesHandler);
        container.register(ResolveAiCapabilityUseCase);
        container.register(ListAiCapabilitiesUseCase);
    }
});
