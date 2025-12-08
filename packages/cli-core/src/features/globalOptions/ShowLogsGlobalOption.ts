import { createImplementation } from "@webiny/di";
import { GlobalCliOption } from "~/abstractions/index.js";

export class ShowLogsGlobalOption implements GlobalCliOption.Interface {
    execute(): GlobalCliOption.Definition {
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
    abstraction: GlobalCliOption,
    implementation: ShowLogsGlobalOption,
    dependencies: []
});
