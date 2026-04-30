import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { CodeMailerSettings as Abstraction } from "~/domain/CodeMailerSettings/abstractions.js";
import type { TransportSettings } from "~/types.js";

const SMTP_TRANSPORT_NAME = "Mailer/SmtpTransport";
const SMTP_BUILD_PARAM_KEY = "Mailer.SmtpSettings";

class CodeMailerSettingsImpl implements Abstraction.Interface {
    constructor(private buildParams: BuildParams.Interface) {}

    get(transportName: string): TransportSettings | null {
        if (transportName !== SMTP_TRANSPORT_NAME) {
            return null;
        }
        const value = this.buildParams.get<TransportSettings>(SMTP_BUILD_PARAM_KEY);
        return value ?? null;
    }
}

export const CodeMailerSettings = Abstraction.createImplementation({
    implementation: CodeMailerSettingsImpl,
    dependencies: [BuildParams]
});
