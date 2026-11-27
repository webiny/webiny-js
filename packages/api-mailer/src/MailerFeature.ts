import { createFeature } from "@webiny/feature/api";
import { MailerServiceFeature } from "~/features/MailerService/feature.js";
import { SendMailFeature } from "~/features/SendMail/feature.js";
import { SendTestMailFeature } from "~/features/SendTestMail/feature.js";
import { IsMailerConfiguredFeature } from "~/features/IsMailerConfigured/feature.js";
import { GetSettingsFeature } from "~/features/GetSettings/feature.js";
import { SaveSettingsFeature } from "~/features/SaveSettings/feature.js";
import { MailerSchemaFactory } from "~/graphql/MailerSchemaFactory.js";

/*
 * Sending, without a transport of its own. Transports are `MailTransportFactory` implementations
 * registered by other packages (`@webiny/mailer-smtp`) or by the project. A transport with stored
 * settings registers a `TransportSettingsDefinition`; reading and saving them is done here.
 */
export const MailerFeature = createFeature({
    name: "Mailer",
    register(container) {
        MailerServiceFeature.register(container);
        SendMailFeature.register(container);
        SendTestMailFeature.register(container);
        IsMailerConfiguredFeature.register(container);
        GetSettingsFeature.register(container);
        SaveSettingsFeature.register(container);
        container.register(MailerSchemaFactory);
    }
});
