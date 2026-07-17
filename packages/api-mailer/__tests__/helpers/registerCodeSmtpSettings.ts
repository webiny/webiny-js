import type { Container } from "@webiny/di";
import { BuildParam } from "@webiny/api-core/features/buildParams/index.js";
import type { TransportSettings } from "~/types.js";

export const registerCodeSmtpSettings = (settings: TransportSettings) => {
    class CodeSmtpSettingsBuildParam implements BuildParam.Interface {
        public readonly key = "Mailer.SmtpSettings";
        public readonly value = settings;
    }

    const implementation = BuildParam.createImplementation({
        implementation: CodeSmtpSettingsBuildParam,
        dependencies: []
    });

    return (container: Container) => {
        container.register(implementation);
    };
};
