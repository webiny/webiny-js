export interface ITraceEntry {
    label: string;
    /* Milliseconds since this process started. */
    start: number;
    end: number;
    /* True when the process exited before the phase closed. `webiny --version` does this. */
    unfinished?: boolean;
}

/*
 * Collects the durations of named phases within a single process, so the CLI can print a timeline of
 * where a run spent its time. Timestamps are relative to process start, which means the report can
 * also account for the time spent before the first line of code ran (loading the module graph).
 *
 * Recording is off unless `WEBINY_CLI_TRACE` is set, and the `trace` helpers short-circuit when it is
 * off, so leaving the instrumentation in place costs a boolean check per phase.
 */
export class TraceRecorder {
    private readonly entries: ITraceEntry[] = [];

    private isEnabled: boolean = process.env.WEBINY_CLI_TRACE === "1";

    /* Distinguishes the reports of the main process and of the forked config render worker. */
    public processLabel = "Webiny CLI";

    public get enabled() {
        return this.isEnabled;
    }

    /*
     * Turns tracing on for the rest of the run. The environment variable is set as well, so that the
     * forked config render worker inherits it and reports its own timings.
     */
    public enable() {
        this.isEnabled = true;
        process.env.WEBINY_CLI_TRACE = "1";
    }

    /* Starts a phase and returns the function that closes it. */
    public start(label: string) {
        if (!this.isEnabled) {
            return () => {
                return;
            };
        }

        const entry: ITraceEntry = { label, start: performance.now(), end: NaN };
        this.entries.push(entry);

        return () => {
            entry.end = performance.now();
        };
    }

    /*
     * Records a phase that already finished. Used for time spent before tracing was installed, and
     * for phases whose label is only known once they are done.
     */
    public record(label: string, start: number, end: number) {
        if (!this.isEnabled) {
            return;
        }

        this.entries.push({ label, start, end });
    }

    /*
     * Phases still open when the report is built are closed at `now` and flagged. This happens on any
     * command that exits the process from inside its handler, `webiny --version` being the obvious one.
     */
    public getEntries(): ITraceEntry[] {
        const now = performance.now();

        const entries = this.entries.map(entry => {
            if (!Number.isNaN(entry.end)) {
                return entry;
            }

            return { ...entry, end: now, unfinished: true };
        });

        entries.sort((a, b) => a.start - b.start);

        return entries;
    }
}

/*
 * One recorder per process. The config render runs in a forked child process, which gets a recorder
 * and a report of its own. Kept next to the class because macOS filesystems are case-insensitive, so
 * a `traceRecorder.ts` module would collide with this file.
 */
export const traceRecorder = new TraceRecorder();
