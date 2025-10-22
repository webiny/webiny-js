import { createImplementation } from "@webiny/di-container";
import { sendEvent } from "@webiny/telemetry/react";
import { TelemetryService as Abstraction } from "./abstractions.js";

class TelemetryServiceImpl implements Abstraction.Interface {
    async sendEvent(event: string, properties?: Record<string, any>): Promise<any> {
        try {
            console.debug("Telemetry:", event, properties);
            await sendEvent(event, properties);
        } catch {
            // This ensures telemetry errors do not break the application.
        }
    }
}

export const TelemetryService = createImplementation({
    abstraction: Abstraction,
    implementation: TelemetryServiceImpl,
    dependencies: []
});
