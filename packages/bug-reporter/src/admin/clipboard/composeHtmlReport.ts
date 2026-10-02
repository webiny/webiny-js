import { toEnvironmentRows } from "./toEnvironmentRows.js";
import { toEventRows } from "./toEventRows.js";
import { screenshotNote } from "./screenshotNote.js";
import { severityMarker } from "./severityMarker.js";
import type { IEventRow } from "./toEventRows.js";
import type { IBugReportPayload } from "../../shared/types.js";

/*
 * Everything in the report is captured text: what the reporter typed, page titles, URLs, console
 * output. Any of it can contain markup, and pasted unescaped it would become markup.
 */
function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function toLines(text: string): string {
    const lines = text.split("\n").map(escapeHtml);
    return lines.join("<br>");
}

function formatEvents(rows: IEventRow[]): string {
    if (rows.length === 0) {
        // An `<ol>` breaks the line by itself, so only this case needs its own `<br>`.
        return "<br><em>Nothing was recorded.</em>";
    }

    const items: string[] = [];
    for (const row of rows) {
        let marker = "";
        if (row.severity) {
            marker = `${severityMarker(row.severity)} `;
        }

        const line = `${marker}<code>${escapeHtml(row.offset)}</code> <strong>${escapeHtml(row.label)}</strong> ${escapeHtml(row.summary)}`;

        if (row.detail) {
            items.push(`<li>${line}<br><code>${escapeHtml(row.detail)}</code></li>`);
            continue;
        }

        items.push(`<li>${line}</li>`);
    }

    // Numbered, so someone reading the report can point at "step 34".
    const list = items.join("");
    return `<ol>${list}</ol>`;
}

/*
 * The rich half of the clipboard copy, which mail clients, Slack, Notion and docs editors paste as
 * formatted text.
 *
 * Laid out with bold labels and line breaks only, no paragraphs, headings or tables. Slack drops the
 * spacing of `<p>` and `<h3>` on paste and runs table cells together, so each of those turned the
 * report into one block. A `<br>` survives everywhere, and a blank line between sections is two.
 */
export function composeHtmlReport(payload: IBugReportPayload): string {
    const sections: string[] = [];

    if (payload.description !== "") {
        const description = toLines(payload.description);
        sections.push(`<strong>Description:</strong> ${description}`);
    }

    if (payload.screenshots.length > 0) {
        const note = screenshotNote(payload.screenshots.length);
        sections.push(`<em>${escapeHtml(note)}</em>`);
    }

    const environment: string[] = ["<strong>Environment</strong>"];
    for (const [label, value] of toEnvironmentRows(payload.environment)) {
        environment.push(`<strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}`);
    }
    const environmentLines = environment.join("<br>");
    sections.push(environmentLines);

    const eventRows = toEventRows(payload.events, payload.reportedAt);
    const events = formatEvents(eventRows);
    sections.push(`<strong>What the reporter did</strong>${events}`);

    return sections.join("<br><br>");
}
