import { createImplementation } from "@webiny/di";
import { GlobalCliOption } from "~/abstractions/index.js";

export class StackTraceGlobalOption implements GlobalCliOption.Interface {
    execute(): GlobalCliOption.Definition {
        return {
            name: "stack-trace",
            config: {
                type: "boolean",
                default: false,
                description: "Show stack traces for errors"
            }
        };
    }
}

export const stackTraceGlobalOption = createImplementation({
    abstraction: GlobalCliOption,
    implementation: StackTraceGlobalOption,
    dependencies: []
});
