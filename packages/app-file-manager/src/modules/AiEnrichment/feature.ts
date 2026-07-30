import { createFeature } from "@webiny/feature/admin";
import { AiImageEnrichmentEventHandler } from "./AiImageEnrichmentEventHandler.js";
import { ReenrichFileGateway } from "./ReenrichFileGateway.js";
import { ReenrichFileGateway as ReenrichFileGatewayAbstraction } from "./abstractions.js";

export const AiEnrichmentFeature = createFeature({
    name: "FileManager/AiEnrichment",
    register(container) {
        container.register(AiImageEnrichmentEventHandler);
        container.register(ReenrichFileGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            reenrichFile: container.resolve(ReenrichFileGatewayAbstraction)
        };
    }
});
