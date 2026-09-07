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

export interface IBugReportPayload {
    /* What the reporter said or typed, verbatim. */
    description: string;
    reportedAt: number;
    events: IReportedEvent[];
    environment: IReportedEnvironment;
    /* Bare base64 PNG, no data-URL prefix. */
    screenshotBase64: string | null;
}

export interface IFiledIssue {
    number: number;
    url: string;
}
