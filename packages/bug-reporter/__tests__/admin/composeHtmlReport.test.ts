import { describe, it, expect } from "vitest";
import { composeHtmlReport } from "~/admin/clipboard/composeHtmlReport.js";
import { buildPayload } from "./buildPayload.js";
import { REPORTED_AT } from "./buildPayload.js";

describe("composeHtmlReport", () => {
    it("carries the description, environment and timeline", () => {
        const html = composeHtmlReport(buildPayload());

        expect(
            html.startsWith("<strong>Description:</strong> Publishing a page does nothing.")
        ).toBe(true);
        expect(html).toContain("<strong>Page:</strong> Pages");
        expect(html).toContain("<li><code>-2.0s</code> <strong>click</strong> Publish</li>");
    });

    it("keeps line breaks in the description", () => {
        const html = composeHtmlReport(buildPayload({ description: "it broke\nagain" }));

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

        const html = composeHtmlReport(buildPayload({ description: "<b>bold</b>", events }));

        expect(html).not.toContain("<img");
        expect(html).not.toContain("<b>");
        expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
        expect(html).toContain("<br><code>a &amp; b</code>");
    });

    it("uses line breaks rather than paragraphs, headings or tables, which Slack flattens", () => {
        const html = composeHtmlReport(buildPayload());

        expect(html).not.toContain("<p>");
        expect(html).not.toContain("<h3>");
        expect(html).not.toContain("<table");
    });

    it("leaves a blank line between sections", () => {
        const html = composeHtmlReport(buildPayload());

        expect(html).toContain("does nothing.<br><br><strong>Environment</strong><br>");
        expect(html).toContain("<br><br><strong>What the reporter did</strong><ol>");
    });

    it("starts with the environment when nothing was typed", () => {
        const html = composeHtmlReport(buildPayload({ description: "" }));

        expect(html.startsWith("<strong>Environment</strong>")).toBe(true);
    });

    it("says so when nothing was recorded", () => {
        const html = composeHtmlReport(buildPayload({ events: [] }));

        expect(html).toContain(
            "<strong>What the reporter did</strong><br><em>Nothing was recorded.</em>"
        );
        expect(html).not.toContain("<ol>");
    });

    it("mentions screenshots only when some were attached", () => {
        const screenshots = [{ mediaType: "image/png", base64: "AAAA" }];

        expect(composeHtmlReport(buildPayload({ screenshots }))).toContain("1 screenshot(s)");
        expect(composeHtmlReport(buildPayload())).not.toContain("screenshot");
    });
});
