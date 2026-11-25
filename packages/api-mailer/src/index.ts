export { MailerFeature } from "./MailerFeature.js";
export { MailerService } from "./domain/MailerService/abstractions.js";
export type { IMailerService, IMailerServiceErrors } from "./domain/MailerService/abstractions.js";
export { MailTransport } from "./domain/MailTransport/abstractions.js";
export { MailTransportFactory } from "./domain/MailTransport/abstractions.js";
export { MAILER_SETTINGS_PERMISSION } from "./constants.js";
export { isMailboxAddress } from "./utils/isMailboxAddress.js";
export { TransportSettingsDefinition } from "./domain/TransportSettings/abstractions.js";
export {
    SettingsValidationError,
    SettingsNotAuthorized,
    SettingsPersistenceError,
    SettingsLockedByCode,
    UnknownTransportSettings
} from "./domain/errors.js";
export { GetSettingsUseCase, GetSettingsRepository } from "./features/GetSettings/index.js";
export type { ISettingsWithSource, MailerSettingsSource } from "./features/GetSettings/index.js";
export {
    SaveSettingsUseCase,
    SaveSettingsRepository,
    MailerSettingsAfterSaveEventHandler,
    MailerSettingsBeforeSaveEventHandler
} from "./features/SaveSettings/index.js";
export type {
    SavedTransportSettings,
    MailerSettingsBeforeSavePayload,
    MailerSettingsAfterSavePayload
} from "./features/SaveSettings/index.js";
