import type { IBugReportPayload } from "~/shared/types.js";

export const REPORTED_AT = 1_000_000;

export function buildPayload(overrides: Partial<IBugReportPayload> = {}): IBugReportPayload {
    return {
        description: "Publishing a page does nothing.",
        reportedAt: REPORTED_AT,
        events: [{ at: REPORTED_AT - 2000, kind: "click", summary: "Publish" }],
        environment: {
            url: "https://admin.example.com/pages",
            page: "Pages",
            userAgent: "Mozilla/5.0",
            viewport: "1440x900",
            language: "en-US",
            timezone: "Europe/Zagreb",
            capturedAt: "2026-09-18T10:00:00.000Z"
        },
        screenshots: [],
        ...overrides
    };
}
