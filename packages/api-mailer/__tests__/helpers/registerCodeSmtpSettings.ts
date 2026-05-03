import { createContextPlugin } from "@webiny/api";
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

    return createContextPlugin(context => {
        context.container.register(implementation);
    });
};
