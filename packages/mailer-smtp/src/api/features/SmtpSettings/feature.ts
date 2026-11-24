import { createFeature } from "@webiny/feature/api";
import { SmtpSettingsDefinition } from "./SmtpSettingsDefinition.js";

export const SmtpSettingsFeature = createFeature({
    name: "MailerSmtp/Settings",
    register(container) {
        container.register(SmtpSettingsDefinition).inSingletonScope();
    }
});
