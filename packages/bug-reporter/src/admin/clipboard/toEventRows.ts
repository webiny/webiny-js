import type { IReportedEvent } from "../../shared/types.js";

const KIND_LABEL: Record<string, string> = {
    route: "nav",
    click: "click",
    input: "edit",
    network: "net",
    console: "log",
    exception: "error"
};

export interface IEventRow {
    // Seconds before the report, e.g. "-14.3s".
    offset: string;
    label: string;
    summary: string;
    detail: string | null;
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
            detail: event.detail ?? null
        };
    });
}
