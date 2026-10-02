import { toEnvironmentRows } from "./toEnvironmentRows.js";
import { toEventRows } from "./toEventRows.js";
import { screenshotNote } from "./screenshotNote.js";
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

function toParagraph(text: string): string {
    const lines = text.split("\n").map(escapeHtml);
    return `<p>${lines.join("<br>")}</p>`;
}

/*
 * The rich half of the clipboard copy, which mail clients, Slack, Notion and docs editors paste as
 * formatted text.
 *
 * The environment is label and value lines rather than a table. Slack and several chat apps drop
 * table structure on paste and run the cells together, while a line break survives everywhere.
 */
export function composeHtmlReport(payload: IBugReportPayload): string {
    const sections: string[] = [];

    if (payload.description !== "") {
        sections.push(toParagraph(payload.description));
    }

    if (payload.screenshots.length > 0) {
        const note = screenshotNote(payload.screenshots.length);
        sections.push(`<p><em>${escapeHtml(note)}</em></p>`);
    }

    const environment: string[] = [];
    for (const [label, value] of toEnvironmentRows(payload.environment)) {
        environment.push(`<strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}`);
    }
    sections.push("<h3>Environment</h3>");
    sections.push(`<p>${environment.join("<br>")}</p>`);

    sections.push("<h3>What the reporter did</h3>");

    const eventRows = toEventRows(payload.events, payload.reportedAt);
    if (eventRows.length === 0) {
        sections.push("<p><em>Nothing was recorded.</em></p>");
    } else {
        const items: string[] = [];
        for (const row of eventRows) {
            const line = `<code>${escapeHtml(row.offset)}</code> <strong>${escapeHtml(row.label)}</strong> ${escapeHtml(row.summary)}`;

            if (row.detail) {
                items.push(`<li>${line}<br><code>${escapeHtml(row.detail)}</code></li>`);
                continue;
            }

            items.push(`<li>${line}</li>`);
        }
        sections.push(`<ul>${items.join("")}</ul>`);
    }

    return sections.join("");
}
