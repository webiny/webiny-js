import { toEnvironmentRows } from "./toEnvironmentRows.js";
import { toEventRows } from "./toEventRows.js";
import { screenshotNote } from "./screenshotNote.js";
import type { IEventRow } from "./toEventRows.js";
import type { IBugReportPayload } from "../../shared/types.js";

// Wide enough for "error", the longest label, so the summaries line up.
const LABEL_WIDTH = 5;

function formatEvents(rows: IEventRow[]): string {
    if (rows.length === 0) {
        return "Nothing was recorded.";
    }

    // Padded to the widest offset, so "-6.6s" and "-14.3s" rows start their labels together.
    let offsetWidth = 0;
    for (const row of rows) {
        offsetWidth = Math.max(offsetWidth, row.offset.length);
    }

    /*
     * Numbered, so someone reading the report can point at "step 34". Padded so "9." and "10."
     * still line up, and a detail line indents to sit under its offset.
     */
    const numberWidth = String(rows.length).length;
    const detailIndent = " ".repeat(numberWidth + 2);

    const lines: string[] = [];

    rows.forEach((row, index) => {
        const number = String(index + 1).padStart(numberWidth);
        const offset = row.offset.padStart(offsetWidth);
        const label = row.label.padEnd(LABEL_WIDTH);
        lines.push(`${number}. ${offset}  ${label}  ${row.summary}`);

        if (row.detail) {
            lines.push(`${detailIndent}${row.detail}`);
        }
    });

    return lines.join("\n");
}

/*
 * The plain-text half of the clipboard copy, for wherever HTML does not paste: a terminal, a code
 * editor, a plain-text field. Readable as is, so no markdown syntax.
 */
export function composePlainReport(payload: IBugReportPayload): string {
    const sections: string[] = [];

    if (payload.description !== "") {
        sections.push(`Description: ${payload.description}`);
    }

    if (payload.screenshots.length > 0) {
        sections.push(screenshotNote(payload.screenshots.length));
    }

    const environment: string[] = [];
    for (const [label, value] of toEnvironmentRows(payload.environment)) {
        environment.push(`${label}: ${value}`);
    }
    sections.push(`Environment\n${environment.join("\n")}`);

    const eventRows = toEventRows(payload.events, payload.reportedAt);
    const events = formatEvents(eventRows);
    sections.push(`What the reporter did\n${events}`);

    return sections.join("\n\n");
}
