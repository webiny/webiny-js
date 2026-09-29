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
 * Streamed back while the report is being processed. Drafting calls a model and filing makes
 * several GitHub round trips, which together take long enough that the dialog has to say what it
 * is doing. Exactly one terminal event ends the stream: `filed`, `compose` or `error`.
 */
export type BugReportStreamEvent =
    | { type: "drafting" }
    | { type: "uploading"; index: number; total: number }
    | { type: "creating" }
    | { type: "filed"; url: string; number: number }
    | { type: "compose"; url: string }
    | { type: "error"; message: string };
