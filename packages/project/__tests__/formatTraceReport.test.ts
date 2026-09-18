import { describe, expect, it } from "vitest";
import { formatTraceReport } from "~/utils/trace/formatTraceReport.js";
import { type ITraceEntry } from "~/utils/trace/TraceRecorder.js";

const entry = (label: string, start: number, end: number): ITraceEntry => {
    return { label, start, end };
};

describe("formatTraceReport", () => {
    it("indents a phase under the phase that contains it", () => {
        const entries = [
            entry("initialize CLI", 100, 900),
            entry("render project config", 200, 700),
            entry("hydrate project config", 300, 400),
            entry("run command", 900, 1000)
        ];

        const report = formatTraceReport("Webiny CLI", entries, 1000);
        const rows = report.split("\n").slice(2);

        expect(rows[0]).toContain("  initialize CLI");
        expect(rows[1]).toContain("    render project config");
        expect(rows[2]).toContain("      hydrate project config");
        expect(rows[3]).toContain("  run command");
    });

    it("reports the share of the total each phase took", () => {
        const entries = [entry("load modules", 0, 250)];

        const report = formatTraceReport("Webiny CLI", entries, 1000);

        expect(report).toContain("250 ms");
        expect(report).toContain("25.0%");
    });

    it("accounts for time that no phase covers", () => {
        const entries = [entry("load modules", 0, 250)];

        const report = formatTraceReport("Webiny CLI", entries, 1000);

        expect(report).toContain("(untraced)");
        expect(report).toContain("750 ms");
    });

    it("hides phases that took under a millisecond and contain nothing", () => {
        const entries = [
            entry("initialize CLI", 100, 900),
            entry("load env vars", 100, 100.2),
            entry('build "about" command', 950, 950.1)
        ];

        const report = formatTraceReport("Webiny CLI", entries, 1000);

        expect(report).toContain("initialize CLI");
        expect(report).not.toContain("load env vars");
        expect(report).not.toContain("about");
        expect(report).toContain("2 phase(s) took under a millisecond");
    });

    it("keeps an instant phase that has phases nested under it", () => {
        const entries = [
            entry("get project config", 100, 100.4),
            entry("render project config", 100, 100.3)
        ];

        const report = formatTraceReport("Webiny CLI", entries, 1000);

        expect(report).toContain("get project config");
    });

    it("flags phases the process exited in the middle of", () => {
        const entries: ITraceEntry[] = [
            { label: "run command", start: 100, end: 900, unfinished: true }
        ];

        const report = formatTraceReport("Webiny CLI", entries, 1000);

        expect(report).toContain("run command (still running at exit)");
    });
});
