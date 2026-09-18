import fs from "fs";
import { traceRecorder } from "./TraceRecorder.js";
import { formatTraceReport } from "./formatTraceReport.js";

/*
 * Call this as the very first statement of a CLI entrypoint. Everything that ran before it — Node
 * booting and evaluating the entrypoint's import graph — is recorded as a single "load modules"
 * phase, which is usually the largest one.
 *
 * The report goes to stderr rather than through `UiService`: it has to survive an `exit` handler, it
 * also runs in the forked config render worker where no DI container exists, and keeping it off
 * stdout means it can never corrupt the output of a piped command.
 */
export const startTrace = (processLabel: string) => {
    // Tracing has to be decided before yargs exists, so the flag is read off `process.argv` by hand.
    // yargs accepts `--trace=true` as well as a bare `--trace`, and both should work the same here.
    const traceArgv = process.argv.find(arg => {
        return arg === "--trace" || arg.startsWith("--trace=");
    });

    const requestedViaArgv = traceArgv !== undefined && traceArgv !== "--trace=false";
    if (requestedViaArgv) {
        traceRecorder.enable();
    }

    if (!traceRecorder.enabled) {
        return;
    }

    traceRecorder.processLabel = processLabel;
    traceRecorder.record("load modules", 0, performance.now());

    process.on("exit", () => {
        const entries = traceRecorder.getEntries();
        const report = formatTraceReport(processLabel, entries, performance.now());

        // `fs.writeSync` rather than `process.stderr.write`: when stderr is a pipe — which it is for
        // the forked render worker — a buffered write is dropped if the process exits first.
        fs.writeSync(2, `\n${report}\n\n`);
    });
};
