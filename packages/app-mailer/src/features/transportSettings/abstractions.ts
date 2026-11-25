import { createAbstraction } from "@webiny/feature/admin";

export type TransportSettingsSource = "code" | "storage" | null;

export interface ITransportSettingsData {
    transport: string;
    // The transport's settings without its secrets. Null when nothing is saved yet.
    settings: Record<string, unknown> | null;
    source: TransportSettingsSource;
}

/**
 * Reads and saves the settings of any transport that registers a `TransportSettingsDefinition` in
 * the API, so a transport's settings form needs no GraphQL of its own. Throws the API's error
 * message on failure.
 */
export interface ITransportSettingsGateway {
    get(transport: string): Promise<ITransportSettingsData>;
    save(transport: string, settings: Record<string, unknown>): Promise<ITransportSettingsData>;
}

export const TransportSettingsGateway = createAbstraction<ITransportSettingsGateway>(
    "Mailer/TransportSettingsGateway"
);

export namespace TransportSettingsGateway {
    export type Interface = ITransportSettingsGateway;
    export type Data = ITransportSettingsData;
}
