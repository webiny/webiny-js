import type { TransportSettingsDefinition } from "./abstractions.js";

export const DEFAULT_STORAGE_KEY_PREFIX = "Mailer/Settings/Transport/";

// The last registered definition for a transport wins, so a project can replace a package's.
export const findDefinition = (
    definitions: TransportSettingsDefinition.Interface[],
    transport: string
): TransportSettingsDefinition.Interface | null => {
    return [...definitions].reverse().find(d => d.transport === transport) ?? null;
};

export const getStorageKey = (definition: TransportSettingsDefinition.Interface): string => {
    return definition.storageKey ?? `${DEFAULT_STORAGE_KEY_PREFIX}${definition.transport}`;
};

export const withDefaults = (
    definition: TransportSettingsDefinition.Interface,
    settings: TransportSettingsDefinition.Values
): TransportSettingsDefinition.Values => {
    return definition.withDefaults ? definition.withDefaults(settings) : settings;
};

export const withoutSecrets = (
    definition: TransportSettingsDefinition.Interface,
    settings: TransportSettingsDefinition.Values
): TransportSettingsDefinition.Values => {
    const secrets = new Set(definition.secrets ?? []);
    return Object.fromEntries(Object.entries(settings).filter(([key]) => !secrets.has(key)));
};
