import { createFeature } from "@webiny/feature/api";
import { CodeMailerSettingsFeature } from "~/api/features/CodeMailerSettings/feature.js";
import { SmtpTransportFeature } from "~/api/features/SmtpTransport/feature.js";
import { GetSettingsFeature } from "~/api/features/GetSettings/feature.js";
import { SaveSettingsFeature } from "~/api/features/SaveSettings/feature.js";
import { AuditLogFeature } from "~/api/features/AuditLog/feature.js";
import { SmtpSettingsSchemaFactory } from "~/api/graphql/SmtpSettingsSchemaFactory.js";

/*
 * The SMTP transport and its settings. The settings come from `Api.Mailer.Smtp` in code or from the
 * Mailer settings screen.
 */
export const MailerSmtpFeature = createFeature({
    name: "MailerSmtp",
    register(container) {
        CodeMailerSettingsFeature.register(container);
        SmtpTransportFeature.register(container);
        GetSettingsFeature.register(container);
        SaveSettingsFeature.register(container);
        AuditLogFeature.register(container);
        container.register(SmtpSettingsSchemaFactory);
    }
});
