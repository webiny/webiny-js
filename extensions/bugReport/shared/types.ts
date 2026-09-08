/*
 * The wire shape between the admin dialog and the API. Types only, no imports: the admin and
 * API bundles both read this file, so anything runtime in here would end up in both.
 */

export interface IReportedEvent {
    at: number;
    kind: string;
    summary: string;
    detail?: string;
}

export interface IReportedEnvironment {
    url: string;
    page: string;
    userAgent: string;
    viewport: string;
    language: string;
    timezone: string;
    capturedAt: string;
}

export interface IReportedScreenshot {
    /* e.g. "image/png". Pasted images are whatever the source produced, not always PNG. */
    mediaType: string;
    /* Bare base64, no data-URL prefix. */
    base64: string;
}

export interface IBugReportPayload {
    /* What the reporter said or typed, verbatim. */
    description: string;
    reportedAt: number;
    events: IReportedEvent[];
    environment: IReportedEnvironment;
    /* Whatever the reporter pasted, in the order they pasted it. Often empty. */
    screenshots: IReportedScreenshot[];
}

export interface IFiledIssue {
    number: number;
    url: string;
}

/*
 * Two ways a report can end, picked by whether the API has a GitHub token.
 *
 * "filed"   — the API created the issue and uploaded the screenshots. `number` is set.
 * "compose" — no token, so the API returns a prefilled new-issue URL for the reporter to open
 *             and submit themselves. Screenshots cannot ride along in a URL; they paste them.
 */
export interface IBugReportOutcome {
    mode: "filed" | "compose";
    /* The filed issue when "filed", the prefilled composer when "compose". */
    url: string;
    /* Only set when "filed". */
    number: number | null;
}
