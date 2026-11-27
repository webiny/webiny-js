import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { TransportSettingsDefinition } from "@webiny/api-mailer";
import { saveValidation } from "./validation.js";
import { MAILER_TRANSPORT_SETTINGS, SMTP_TRANSPORT_NAME } from "~/api/constants.js";

const SMTP_BUILD_PARAM_KEY = "Mailer.SmtpSettings";
const DEFAULT_PORT = 587;

/*
 * SMTP's settings, stored and edited through the core mailer. `<Api.Mailer.Smtp>` props set them in
 * code, which locks the settings screen.
 */
class SmtpSettingsDefinitionImpl implements TransportSettingsDefinition.Interface {
    public readonly transport = SMTP_TRANSPORT_NAME;
    // The key SMTP settings were stored under before the settings store was shared.
    public readonly storageKey = MAILER_TRANSPORT_SETTINGS;
    public readonly schema = saveValidation;
    public readonly secrets = ["password"];
    public readonly secretsBoundTo = ["host", "port", "secure", "user"];

    constructor(private buildParams: BuildParams.Interface) {}

    withDefaults(settings: TransportSettingsDefinition.Values): TransportSettingsDefinition.Values {
        const port = Number(settings.port || DEFAULT_PORT);
        return { ...settings, port, secure: settings.secure ?? port === 465 };
    }

    getCodeSettings(): TransportSettingsDefinition.Values | null {
        return (
            this.buildParams.get<TransportSettingsDefinition.Values>(SMTP_BUILD_PARAM_KEY) ?? null
        );
    }
}

export const SmtpSettingsDefinition = TransportSettingsDefinition.createImplementation({
    implementation: SmtpSettingsDefinitionImpl,
    dependencies: [BuildParams]
});
