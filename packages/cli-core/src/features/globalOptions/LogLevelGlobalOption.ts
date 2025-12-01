import { createImplementation } from "@webiny/di";
import { GlobalCliOption } from "~/abstractions/index.js";

export class LogLevelGlobalOption implements GlobalCliOption.Interface {
    execute(): GlobalCliOption.Definition {
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
    abstraction: GlobalCliOption,
    implementation: LogLevelGlobalOption,
    dependencies: []
});

