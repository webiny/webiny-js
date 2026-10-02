import type { IBugReportPayload } from "../../shared/types.js";
import type { IReportedEnvironment } from "../../shared/types.js";
import type { IReportedEvent } from "../../shared/types.js";

const KIND_LABEL: Record<string, string> = {
    route: "nav",
    click: "click",
    input: "edit",
    network: "net",
    console: "log",
    exception: "error"
};

// Wide enough for "error", the longest label, so the summaries line up.
const LABEL_WIDTH = 5;

function formatEnvironment(environment: IReportedEnvironment): string {
    const rows: [string, string][] = [
        ["Page", environment.page],
        ["URL", environment.url],
        ["Viewport", environment.viewport],
        ["Browser", environment.userAgent],
        ["Language", environment.language],
        ["Timezone", environment.timezone],
        ["Captured", environment.capturedAt]
    ];

    const lines: string[] = [];
    for (const [key, value] of rows) {
        lines.push(`${key}: ${value}`);
    }

    return lines.join("\n");
}

function formatEvents(events: IReportedEvent[], reportedAt: number): string {
    if (events.length === 0) {
        return "Nothing was recorded.";
    }

    const lines: string[] = [];

    for (const event of events) {
        const secondsAgo = (reportedAt - event.at) / 1000;
        const offset = `-${secondsAgo.toFixed(1)}s`;
        const label = KIND_LABEL[event.kind] ?? event.kind;
        lines.push(`${offset}  ${label.padEnd(LABEL_WIDTH)}  ${event.summary}`);

        if (event.detail) {
            lines.push(`    ${event.detail}`);
        }
    }

    return lines.join("\n");
}

/*
 * The report for sending some other way than GitHub: mail, chat, a support ticket.
 *
 * Plain text rather than the issue's markdown, because wherever it gets pasted is unlikely to
 * render a table or a `<details>` block, and raw they bury the report in syntax. It carries the
 * same facts as the issue, without the GitHub-only parts: the verbatim quote (the description
 * already is verbatim here) and the footer.
 *
 * Built in the browser, not by the API. Clipboard writes need a recent click, and a round trip
 * through drafting can take long enough for the browser to stop counting it.
 */
export function composeClipboardReport(payload: IBugReportPayload): string {
    const sections: string[] = [];

    if (payload.description !== "") {
        sections.push(payload.description);
    }

    if (payload.screenshots.length > 0) {
        sections.push(
            `${payload.screenshots.length} screenshot(s) attached in the dialog. They cannot be copied with the text, so paste them in alongside it.`
        );
    }

    const environment = formatEnvironment(payload.environment);
    sections.push(`Environment\n${environment}`);

    const events = formatEvents(payload.events, payload.reportedAt);
    sections.push(`What the reporter did\n${events}`);

    return sections.join("\n\n");
}
