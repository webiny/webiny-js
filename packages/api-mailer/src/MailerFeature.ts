import { createFeature } from "@webiny/feature/api";
import { MailerServiceFeature } from "~/features/MailerService/feature.js";
import { SendMailFeature } from "~/features/SendMail/feature.js";
import { SendTestMailFeature } from "~/features/SendTestMail/feature.js";
import { IsMailerConfiguredFeature } from "~/features/IsMailerConfigured/feature.js";
import { MailerSchemaFactory } from "~/graphql/MailerSchemaFactory.js";

/*
 * Sending, without a transport of its own. Transports are `MailTransportFactory` implementations
 * registered by other packages (`@webiny/mailer-smtp`) or by the project.
 */
export const MailerFeature = createFeature({
    name: "Mailer",
    register(container) {
        MailerServiceFeature.register(container);
        SendMailFeature.register(container);
        SendTestMailFeature.register(container);
        IsMailerConfiguredFeature.register(container);
        container.register(MailerSchemaFactory);
    }
});
