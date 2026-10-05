import type { IReportedEvent } from "../../shared/types.js";

const KIND_LABEL: Record<string, string> = {
    route: "nav",
    click: "click",
    input: "edit",
    network: "net",
    console: "log",
    exception: "error"
};

export type EventSeverity = "error" | "warning";

export interface IEventRow {
    // Seconds before the report, e.g. "-14.3s".
    offset: string;
    label: string;
    summary: string;
    detail: string | null;
    // Set for the events worth spotting at a glance; null for the rest of the timeline.
    severity: EventSeverity | null;
}

// "POST Login → 500 (41ms)". The recorder only keeps a non-GraphQL request when it failed.
const FAILED_STATUS_PATTERN = / → [45]\d\d \(/;

/*
 * The recorder writes the level into the summary rather than a field of its own, so it is read back
 * from there. Kept here, not in the recorder, because only the clipboard copy cares.
 */
function readSeverity(event: IReportedEvent): EventSeverity | null {
    if (event.kind === "exception") {
        return "error";
    }
    if (event.kind === "console") {
        if (event.summary.startsWith("console.error:")) {
            return "error";
        }
        if (event.summary.startsWith("console.warn:")) {
            return "warning";
        }
        return null;
    }
    if (event.kind === "network") {
        if (event.summary.endsWith(" never completed")) {
            return "error";
        }
        if (FAILED_STATUS_PATTERN.test(event.summary)) {
            return "error";
        }
    }
    return null;
}

/*
 * Recorded events, timestamped relative to the moment the report was opened. Both clipboard formats
 * render from these, so they agree on labels and offsets.
 */
export function toEventRows(events: IReportedEvent[], reportedAt: number): IEventRow[] {
    return events.map(event => {
        const secondsAgo = (reportedAt - event.at) / 1000;

        return {
            offset: `-${secondsAgo.toFixed(1)}s`,
            label: KIND_LABEL[event.kind] ?? event.kind,
            summary: event.summary,
            detail: event.detail ?? null,
            severity: readSeverity(event)
        };
    });
}
