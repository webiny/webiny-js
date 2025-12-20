import { ContextPlugin } from "@webiny/api";
import type { Context } from "@webiny/api/types.js";
import { EncryptionFeature } from "~/features/Encryption/feature.js";
import { GetSettingsFeature } from "~/features/GetSettings/feature.js";
import { SaveSettingsFeature } from "~/features/SaveSettings/feature.js";
import { DummyTransportFeature } from "~/features/DummyTransport/feature.js";
import { SmtpTransportFeature } from "~/features/SmtpTransport/feature.js";
import { MailerServiceFeature } from "~/features/MailerService/feature.js";
import { SendMailFeature } from "~/features/SendMail/feature.js";

export const createMailerContext = () => {
    return new ContextPlugin<Context>(async context => {
        // Register all features
        EncryptionFeature.register(context.container);
        DummyTransportFeature.register(context.container);
        SmtpTransportFeature.register(context.container);
        GetSettingsFeature.register(context.container);
        SaveSettingsFeature.register(context.container);
        MailerServiceFeature.register(context.container);
        SendMailFeature.register(context.container);
    });
};
