import { createAbstraction } from "@webiny/feature/admin";

export interface ITelemetryService {
    sendEvent(event: string, properties?: Record<string, any>): Promise<any>;
}

export const TelemetryService = createAbstraction<ITelemetryService>("TelemetryService");

export namespace TelemetryService {
    export type Interface = ITelemetryService;
}
