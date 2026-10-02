import { composeIssueBody } from "../../shared/composeIssueBody.js";
import { formatTimeline } from "../../shared/formatTimeline.js";
import type { IIssueDraft } from "../../shared/types.js";
import type { IBugReportPayload } from "../../shared/types.js";

const SCREENSHOT_NOTE = [
    "> [!IMPORTANT]",
    "> Screenshots were attached in the dialog but cannot travel on the clipboard with the text.",
    "> Paste them in alongside this report."
].join("\n");

/*
 * The report as GitHub would get it, for sending some other way: mail, chat, a support ticket.
 *
 * Built in the browser, not by the API. Clipboard writes need a recent click, and a round trip
 * through drafting can take long enough for the browser to stop counting it. So the draft is the
 * reporter's own words, which is also what the API files when no model is configured. Nothing is
 * trimmed either: unlike the composer URL, the clipboard has no length limit worth worrying about.
 */
export function composeClipboardReport(payload: IBugReportPayload): string {
    const draft: IIssueDraft = {
        title: "",
        summary: payload.description,
        stepsToReproduce: [],
        expected: "",
        actual: ""
    };

    const timeline = formatTimeline(payload.events, payload.reportedAt);

    const body = composeIssueBody({
        draft,
        description: payload.description,
        environment: payload.environment,
        timeline,
        screenshotUrls: []
    });

    if (payload.screenshots.length === 0) {
        return body;
    }

    return `${SCREENSHOT_NOTE}\n\n${body}`;
}
