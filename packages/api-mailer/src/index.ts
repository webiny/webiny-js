import type { PluginCollection } from "@webiny/plugins/types.js";
import { createMailerContext as createMailerContextPlugin } from "~/context.js";
import { createGraphQL } from "~/graphql/index.js";

// Export domain abstractions
export { Encryption } from "~/domain/Encryption/abstractions.js";
export { MailTransport } from "~/domain/MailTransport/abstractions.js";
export { MailerService } from "~/domain/MailerService/abstractions.js";

// Export domain errors
export {
    NoTransportAvailableError,
    NoSettingsConfiguredError,
    TransportSendError
} from "~/domain/MailerService/errors.js";

// Export feature abstractions
export { GetSettings, GetSettingsRepository } from "~/features/GetSettings/abstractions.js";
export { SaveSettings, SaveSettingsRepository } from "~/features/SaveSettings/abstractions.js";
export { SendMail } from "~/features/SendMail/abstractions.js";

// Export utilities
export { SmtpConfig } from "~/features/SmtpTransport/SmtpConfig.js";

// Export types
export type { TransportSettings, TransportSendData, TransportSendResponse } from "~/types.js";
export type { SmtpTransportConfig } from "~/features/SmtpTransport/SmtpConfig.js";

export const createMailerContext = (): PluginCollection => {
    return [createMailerContextPlugin()];
};

export const createMailerGraphQL = () => {
    return [...createGraphQL()];
};
