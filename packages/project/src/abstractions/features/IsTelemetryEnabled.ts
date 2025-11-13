import { createAbstraction } from "~/abstractions/createAbstraction.js";

interface IIsTelemetryEnabled {
    execute(): Promise<boolean>;
}

export const IsTelemetryEnabled = createAbstraction<IIsTelemetryEnabled>("IsTelemetryEnabled");

export namespace IsTelemetryEnabled {
    export type Interface = IIsTelemetryEnabled;
}
