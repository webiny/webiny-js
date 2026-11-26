import { createFeature } from "@webiny/feature/api";
import { SmtpSettingsFeature } from "~/api/features/SmtpSettings/feature.js";
import { SmtpTransportFeature } from "~/api/features/SmtpTransport/feature.js";
import { SmtpSettingsSchemaFactory } from "~/api/graphql/SmtpSettingsSchemaFactory.js";

/*
 * The SMTP transport and its settings definition. The core mailer stores, reads and audits the
 * settings; they come from `<Api.Mailer.Smtp>` props in code or from the Mailer settings screen.
 */
export const MailerSmtpFeature = createFeature({
    name: "MailerSmtp",
    register(container) {
        SmtpSettingsFeature.register(container);
        SmtpTransportFeature.register(container);
        container.register(SmtpSettingsSchemaFactory);
    }
});
