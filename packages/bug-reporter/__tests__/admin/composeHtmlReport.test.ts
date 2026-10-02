import { describe, it, expect } from "vitest";
import { composeHtmlReport } from "~/admin/clipboard/composeHtmlReport.js";
import { buildPayload } from "./buildPayload.js";
import { REPORTED_AT } from "./buildPayload.js";

describe("composeHtmlReport", () => {
    it("carries the description, environment and timeline", () => {
        const html = composeHtmlReport(buildPayload());

        expect(html.startsWith("<p>Publishing a page does nothing.</p>")).toBe(true);
        expect(html).toContain("<strong>Page:</strong> Pages");
        expect(html).toContain("<li><code>-2.0s</code> <strong>click</strong> Publish</li>");
    });

    it("keeps line breaks in the description", () => {
        const html = composeHtmlReport(buildPayload({ description: "it broke\nagain" }));

        expect(html).toContain("<p>it broke<br>again</p>");
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

    it("lists the environment as lines, not a table", () => {
        expect(composeHtmlReport(buildPayload())).not.toContain("<table");
    });

    it("says so when nothing was recorded", () => {
        const html = composeHtmlReport(buildPayload({ events: [] }));

        expect(html).toContain("<p><em>Nothing was recorded.</em></p>");
        expect(html).not.toContain("<ul>");
    });

    it("mentions screenshots only when some were attached", () => {
        const screenshots = [{ mediaType: "image/png", base64: "AAAA" }];

        expect(composeHtmlReport(buildPayload({ screenshots }))).toContain("1 screenshot(s)");
        expect(composeHtmlReport(buildPayload())).not.toContain("screenshot");
    });
});
