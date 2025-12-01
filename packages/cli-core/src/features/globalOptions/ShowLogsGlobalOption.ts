import { createImplementation } from "@webiny/di";
import { GlobalOption } from "~/abstractions/index.js";

export class ShowLogsGlobalOption implements GlobalOption.Interface {
    execute(): GlobalOption.Definition {
        return {
            name: "show-logs",
            config: {
                type: "boolean",
                default: false,
                description: "Print logs directly in the terminal"
            }
        };
    }
}

export const showLogsGlobalOption = createImplementation({
    abstraction: GlobalOption,
    implementation: ShowLogsGlobalOption,
    dependencies: []
});

