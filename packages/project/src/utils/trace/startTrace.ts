import fs from "fs";
import { traceRecorder } from "./TraceRecorder.js";
import { formatTraceReport } from "./formatTraceReport.js";
import { isTraceRequested } from "./isTraceRequested.js";

/*
 * Call this as the very first statement of a CLI entrypoint. Everything that ran before it is
 * recorded as a single "load modules" phase: Node booting, then evaluating the entrypoint's import
 * graph. That phase is usually the largest one.
 *
 * None of this goes through `LoggerService`, and it is worth saying why, because that is the obvious
 * question. The logger needs `GetProjectService` and `ProjectSdkParamsService`, so it only exists
 * once the project SDK container has been built, and building that container is roughly two thirds
 * of what we are trying to measure. The phases before it (loading modules, the preflight checks) run
 * in `bin.ts` where there is no container at all, and the config render worker is a separate process
 * with no container either. Writing straight to stderr is also what lets the report survive an `exit`
 * handler, and keeping it off stdout means it can never corrupt the output of a piped command.
 */
export const startTrace = (processLabel: string) => {
    const requestedViaArgv = isTraceRequested(process.argv);
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

        // `fs.writeSync` rather than `process.stderr.write`: when stderr is a pipe, which it is for
        // the forked render worker, a buffered write is dropped if the process exits first.
        fs.writeSync(2, `\n${report}\n\n`);
    });
};
