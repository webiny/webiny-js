export {
    SendMailUseCase,
    MailSendErrorEventHandler,
    MailBeforeSendEventHandler,
    MailAfterSendEventHandler
} from "@webiny/api-mailer/features/SendMail/index.js";
export { IsMailerConfiguredUseCase } from "@webiny/api-mailer/features/IsMailerConfigured/index.js";
export {
    MailTransport,
    MailTransportFactory
} from "@webiny/api-mailer/domain/MailTransport/abstractions.js";
export {
    GetSettingsUseCase,
    GetSettingsRepository
} from "@webiny/mailer-smtp/api/features/GetSettings/index.js";
export {
    SaveSettingsUseCase,
    SaveSettingsRepository,
    MailerSettingsAfterSaveEventHandler,
    MailerSettingsBeforeSaveEventHandler
} from "@webiny/mailer-smtp/api/features/SaveSettings/index.js";
