import { createImplementation } from "@webiny/di";
import { GlobalCliOption } from "~/abstractions/index.js";

/*
 * Declared here only so the flag shows up in `webiny --help`. The CLI entrypoint reads it straight
 * off `process.argv`, because tracing has to be on before yargs is built.
 */
export class TraceGlobalOption implements GlobalCliOption.Interface {
    execute(): GlobalCliOption.Definition {
        return {
            name: "trace",
            config: {
                type: "boolean",
                default: false,
                description: "Print a timing breakdown of the run"
            }
        };
    }
}

export const traceGlobalOption = createImplementation({
    abstraction: GlobalCliOption,
    implementation: TraceGlobalOption,
    dependencies: []
});
