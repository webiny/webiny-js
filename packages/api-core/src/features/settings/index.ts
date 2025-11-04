export { SettingsFeature } from "./feature.js";

// Export abstractions
export { GetSettings } from "./GetSettings/index.js";
export { UpdateSettings } from "./UpdateSettings/index.js";
export { SettingsRepository, SettingsStorageOperations } from "./shared/abstractions.js";

// Export types
export type { Settings, GetSettingsInput, UpdateSettingsInput } from "./shared/types.js";

// Export errors
export {
    SettingsNotFoundError,
    SettingsStorageError,
    SettingsValidationError
} from "./shared/errors.js";

// Export events
export {
    SettingsBeforeUpdateEvent,
    SettingsAfterUpdateEvent,
    SettingsBeforeUpdateHandler,
    SettingsAfterUpdateHandler
} from "./UpdateSettings/index.js";
