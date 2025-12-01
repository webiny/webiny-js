import { createImplementation } from "@webiny/di";
import { GlobalOption } from "~/abstractions/index.js";

export class StackTraceGlobalOption implements GlobalOption.Interface {
    execute(): GlobalOption.Definition {
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
    abstraction: GlobalOption,
    implementation: StackTraceGlobalOption,
    dependencies: []
});

