import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { composeHtmlReport } from "~/admin/clipboard/composeHtmlReport.js";
import { buildPayload } from "./buildPayload.js";
import { REPORTED_AT } from "./buildPayload.js";

describe("composeHtmlReport", () => {
    it("carries the description, environment and timeline", () => {
        const payload = buildPayload();
        const html = composeHtmlReport(payload);

        expect(
            html.startsWith("<strong>Description:</strong> Publishing a page does nothing.")
        ).toBe(true);
        expect(html).toContain("<strong>Page:</strong> Pages");
        expect(html).toContain("<li><code>-2.0s</code> <strong>click</strong> Publish</li>");
    });

    it("keeps line breaks in the description", () => {
        const payload = buildPayload({ description: "it broke\nagain" });
        const html = composeHtmlReport(payload);

        expect(html).toContain("<strong>Description:</strong> it broke<br>again");
    });

    it("escapes captured text so it cannot become markup", () => {
        const events = [
            {
                at: REPORTED_AT,
                kind: "console",
                summary: "<img src=x onerror=alert(1)>",
                detail: "a & b"
            }
        ];

        const payload = buildPayload({ description: "<b>bold</b>", events });

        const html = composeHtmlReport(payload);

        expect(html).not.toContain("<img");
        expect(html).not.toContain("<b>");
        expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
        expect(html).toContain("<br><code>a &amp; b</code>");
    });

    it("uses line breaks rather than paragraphs, headings or tables, which Slack flattens", () => {
        const payload = buildPayload();
        const html = composeHtmlReport(payload);

        expect(html).not.toContain("<p>");
        expect(html).not.toContain("<h3>");
        expect(html).not.toContain("<table");
    });

    it("leaves a blank line between sections", () => {
        const payload = buildPayload();
        const html = composeHtmlReport(payload);

        expect(html).toContain("does nothing.<br><br><strong>Environment</strong><br>");
        expect(html).toContain("<br><br><strong>What the reporter did</strong><ol>");
    });

    it("starts with the environment when nothing was typed", () => {
        const payload = buildPayload({ description: "" });
        const html = composeHtmlReport(payload);

        expect(html.startsWith("<strong>Environment</strong>")).toBe(true);
    });

    it("says so when nothing was recorded", () => {
        const payload = buildPayload({ events: [] });
        const html = composeHtmlReport(payload);

        expect(html).toContain(
            "<strong>What the reporter did</strong><br><em>Nothing was recorded.</em>"
        );
        expect(html).not.toContain("<ol>");
    });

    it("marks errors and warnings in front of their offset", () => {
        const events = [
            { at: REPORTED_AT, kind: "console", summary: "console.warn: careful" },
            { at: REPORTED_AT, kind: "network", summary: "POST Login → 500 (41ms)" },
            { at: REPORTED_AT, kind: "click", summary: "Clicked main" }
        ];

        const payload = buildPayload({ events });
        const html = composeHtmlReport(payload);

        expect(html).toContain("<li>🟡 <code>-0.0s</code> <strong>log</strong>");
        expect(html).toContain("<li>🔴 <code>-0.0s</code> <strong>net</strong>");
        expect(html).toContain("<li><code>-0.0s</code> <strong>click</strong> Clicked main</li>");
    });

    it("mentions screenshots only when some were attached", () => {
        const screenshots = [{ mediaType: "image/png", base64: "AAAA" }];

        const withScreenshots = buildPayload({ screenshots });
        const withoutScreenshots = buildPayload();

        const htmlWith = composeHtmlReport(withScreenshots);
        const htmlWithout = composeHtmlReport(withoutScreenshots);

        expect(htmlWith).toContain("1 screenshot(s)");
        expect(htmlWithout).not.toContain("screenshot");
    });
});
