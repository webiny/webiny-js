import { composePlainReport } from "./composePlainReport.js";
import { composeHtmlReport } from "./composeHtmlReport.js";
import type { IBugReportPayload } from "../../shared/types.js";

/*
 * Puts the report on the clipboard in two formats at once. Whatever it is pasted into picks the one
 * it understands: rich editors take the HTML, plain-text fields take the text.
 *
 * Falls back to text alone where `ClipboardItem` is missing, which is older browsers only.
 */
export async function writeReportToClipboard(payload: IBugReportPayload): Promise<void> {
    const plain = composePlainReport(payload);

    if (typeof ClipboardItem === "undefined") {
        await navigator.clipboard.writeText(plain);
        return;
    }

    const html = composeHtmlReport(payload);

    const item = new ClipboardItem({
        "text/plain": new Blob([plain], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" })
    });

    await navigator.clipboard.write([item]);
}
