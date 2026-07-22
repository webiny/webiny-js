export {
    SendMailUseCase,
    MailSendErrorEventHandler,
    MailBeforeSendEventHandler,
    MailAfterSendEventHandler
} from "@webiny/api-mailer/features/SendMail/index.js";
export {
    GetSettingsUseCase,
    GetSettingsRepository
} from "@webiny/api-mailer/features/GetSettings/index.js";
export {
    SaveSettingsUseCase,
    SaveSettingsRepository,
    MailerSettingsAfterSaveEventHandler,
    MailerSettingsBeforeSaveEventHandler
} from "@webiny/api-mailer/features/SaveSettings/index.js";
export { MailerService } from "@webiny/api-mailer/domain/MailerService/abstractions.js";
