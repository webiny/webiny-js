import { createAbstraction } from "@webiny/feature/api";
import type { ZodType } from "zod";

export type TransportSettingsValues = Record<string, unknown>;

export interface ITransportSettingsDefinition {
    /**
     * The transport the settings belong to. Matches the `name` of its `MailTransportFactory`.
     */
    transport: string;
    /**
     * Key-value store key. Defaults to `Mailer/Settings/Transport/<transport>`.
     */
    storageKey?: string;
    /**
     * Validates the settings sent to save. Secret fields are optional in it: a save without one
     * keeps the stored value.
     */
    schema: ZodType;
    /**
     * Fields that are encrypted at rest and never leave the server: they are left out of the
     * settings the GraphQL API returns and out of the save events.
     */
    secrets?: string[];
    /**
     * Fields a stored secret is bound to. When a save changes one of them, the secrets must be sent
     * again, so a settings editor can't point the transport at a server they control and receive the
     * stored secret.
     */
    secretsBoundTo?: string[];
    /**
     * Fills in defaults, on read and before comparing `secretsBoundTo` fields on save.
     */
    withDefaults?(settings: TransportSettingsValues): TransportSettingsValues;
    /**
     * Settings set in code. When not null, they are used instead of the stored ones, and saving
     * fails with `SettingsLockedByCode`.
     */
    getCodeSettings?(): TransportSettingsValues | null;
}

/**
 * Registered by a transport whose settings are stored and edited in Settings > Mailer. The core
 * mailer then provides reading, saving, the `mailer.settings` permission, encryption of secrets,
 * the save events and the audit log for it.
 */
export const TransportSettingsDefinition = createAbstraction<ITransportSettingsDefinition>(
    "Mailer/TransportSettingsDefinition"
);

export namespace TransportSettingsDefinition {
    export type Interface = ITransportSettingsDefinition;
    export type Values = TransportSettingsValues;
}
