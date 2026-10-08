import type { IReportedEvent } from "../shared/types.js";

const KIND_LABEL: Record<string, string> = {
    route: "nav",
    click: "click",
    input: "edit",
    network: "net",
    console: "log",
    exception: "error"
};

/*
 * Renders the recorded events as a markdown list, timestamped relative to the moment the report
 * was filed. Reading downwards gets you to the failure, which is the order someone triaging the
 * issue wants. Also handed to the model as the evidence it drafts from.
 */
export function formatTimeline(events: IReportedEvent[], reportedAt: number): string {
    if (events.length === 0) {
        return "_Nothing was recorded._";
    }

    const lines: string[] = [];

    for (const event of events) {
        const secondsAgo = (reportedAt - event.at) / 1000;
        const offset = `-${secondsAgo.toFixed(1)}s`;
        const label = KIND_LABEL[event.kind] ?? event.kind;
        const line = `- \`${offset}\` **${label}** ${event.summary}`;

        if (event.detail) {
            lines.push(`${line}\n  <br>\`${event.detail}\``);
            continue;
        }

        lines.push(line);
    }

    return lines.join("\n");
}
