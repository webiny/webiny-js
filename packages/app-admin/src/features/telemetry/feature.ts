import { createFeature } from "@webiny/feature/admin";
import { TelemetryService as TelemetryServiceAbstraction } from "./abstractions.js";
import { TelemetryService } from "./TelemetryService.js";

export const TelemetryFeature = createFeature({
    name: "Telemetry",
    register(container) {
        container.register(TelemetryService).inSingletonScope();
    },
    resolve(container) {
        return {
            service: container.resolve(TelemetryServiceAbstraction)
        };
    }
});
