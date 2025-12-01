import { createImplementation } from "@webiny/di";
import { GlobalOption } from "~/abstractions/index.js";

export class LogLevelGlobalOption implements GlobalOption.Interface {
    execute(): GlobalOption.Definition {
        return {
            name: "log-level",
            config: {
                type: "string",
                default: "info",
                choices: ["silent", "fatal", "error", "warn", "info", "debug", "trace"],
                description: "Set the verbosity of logs"
            }
        };
    }
}

export const logLevelGlobalOption = createImplementation({
    abstraction: GlobalOption,
    implementation: LogLevelGlobalOption,
    dependencies: []
});

