import { createFeature } from "@webiny/feature/api";
import { CodeMailerSettingsFeature } from "~/features/CodeMailerSettings/feature.js";
import { DummyTransportFeature } from "~/features/DummyTransport/feature.js";
import { SmtpTransportFeature } from "~/features/SmtpTransport/feature.js";
import { GetSettingsFeature } from "~/features/GetSettings/feature.js";
import { SaveSettingsFeature } from "~/features/SaveSettings/feature.js";
import { MailerServiceFeature } from "~/features/MailerService/feature.js";
import { SendMailFeature } from "~/features/SendMail/feature.js";
import { MailerSchemaFactory } from "~/graphql/MailerSchemaFactory.js";

export const MailerFeature = createFeature({
    name: "Mailer",
    register(container) {
        CodeMailerSettingsFeature.register(container);
        DummyTransportFeature.register(container);
        SmtpTransportFeature.register(container);
        GetSettingsFeature.register(container);
        SaveSettingsFeature.register(container);
        MailerServiceFeature.register(container);
        SendMailFeature.register(container);
        container.register(MailerSchemaFactory);
    }
});
