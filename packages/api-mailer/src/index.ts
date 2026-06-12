import { CodeMailerSettingsFeature } from "~/features/CodeMailerSettings/feature.js";
import { GetSettingsFeature } from "~/features/GetSettings/feature.js";
import { SaveSettingsFeature } from "~/features/SaveSettings/feature.js";
import { DummyTransportFeature } from "~/features/DummyTransport/feature.js";
import { SmtpTransportFeature } from "~/features/SmtpTransport/feature.js";
import { MailerServiceFeature } from "~/features/MailerService/feature.js";
import { SendMailFeature } from "~/features/SendMail/feature.js";
import { createSettingsGraphQL } from "~/graphql/settings.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";

export { MailerFeature } from "./MailerFeature.js";
export { MailerService } from "./domain/MailerService/abstractions.js";
export type { IMailerService, IMailerServiceErrors } from "./domain/MailerService/abstractions.js";

export const createMailerContext = () => {
    return createRegisterExtensionPlugin(context => {
        // Register all features.
        CodeMailerSettingsFeature.register(context.container);
        DummyTransportFeature.register(context.container);
        SmtpTransportFeature.register(context.container);
        GetSettingsFeature.register(context.container);
        SaveSettingsFeature.register(context.container);
        MailerServiceFeature.register(context.container);
        SendMailFeature.register(context.container);
    });
};

export const createMailerGraphQL = () => {
    return createSettingsGraphQL();
};
