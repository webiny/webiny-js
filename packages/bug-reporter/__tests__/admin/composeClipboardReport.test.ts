import { describe, it, expect } from "vitest";
import { composeClipboardReport } from "~/admin/clipboard/composeClipboardReport.js";
import type { IBugReportPayload } from "~/shared/types.js";

const REPORTED_AT = 1_000_000;

function buildPayload(overrides: Partial<IBugReportPayload> = {}): IBugReportPayload {
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

describe("composeClipboardReport", () => {
    it("carries the description, environment and timeline", () => {
        const text = composeClipboardReport(buildPayload());

        expect(text.startsWith("Publishing a page does nothing.")).toBe(true);
        expect(text).toContain("Page: Pages");
        expect(text).toContain("-2.0s  click  Publish");
    });

    it("leaves out the markdown only GitHub renders", () => {
        const text = composeClipboardReport(buildPayload());

        expect(text).not.toContain("|");
        expect(text).not.toContain("<details>");
        expect(text).not.toContain("**");
        expect(text).not.toContain("Reported verbatim");
    });

    it("puts an event's detail on its own line", () => {
        const events = [
            { at: REPORTED_AT, kind: "exception", summary: "TypeError", detail: "at render" }
        ];

        const text = composeClipboardReport(buildPayload({ events }));

        expect(text).toContain("-0.0s  error  TypeError\n    at render");
    });

    it("starts with the environment when nothing was typed", () => {
        const text = composeClipboardReport(buildPayload({ description: "" }));

        expect(text.startsWith("Environment\n")).toBe(true);
    });

    it("keeps every recorded event, since nothing has to fit in a URL", () => {
        const events = Array.from({ length: 100 }, (_, index) => {
            return { at: REPORTED_AT - index, kind: "click", summary: `button ${index}` };
        });

        const text = composeClipboardReport(buildPayload({ events }));

        expect(text).toContain("button 0");
        expect(text).toContain("button 99");
    });

    it("asks for the screenshots to be pasted when some were attached", () => {
        const screenshots = [{ mediaType: "image/png", base64: "AAAA" }];

        const text = composeClipboardReport(buildPayload({ screenshots }));

        expect(text).toContain("1 screenshot(s) attached in the dialog.");
        expect(text).not.toContain("AAAA");
    });

    it("says nothing about screenshots when there are none", () => {
        expect(composeClipboardReport(buildPayload())).not.toContain("screenshot");
    });
});
