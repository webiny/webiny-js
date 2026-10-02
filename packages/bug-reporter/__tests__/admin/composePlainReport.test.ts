import { describe, it, expect } from "vitest";
import { composePlainReport } from "~/admin/clipboard/composePlainReport.js";
import { buildPayload } from "./buildPayload.js";
import { REPORTED_AT } from "./buildPayload.js";

describe("composePlainReport", () => {
    it("carries the description, environment and timeline", () => {
        const text = composePlainReport(buildPayload());

        expect(text.startsWith("Publishing a page does nothing.")).toBe(true);
        expect(text).toContain("Page: Pages");
        expect(text).toContain("-2.0s  click  Publish");
    });

    it("leaves out the markdown only GitHub renders", () => {
        const text = composePlainReport(buildPayload());

        expect(text).not.toContain("|");
        expect(text).not.toContain("<details>");
        expect(text).not.toContain("**");
        expect(text).not.toContain("Reported verbatim");
    });

    it("puts an event's detail on its own line", () => {
        const events = [
            { at: REPORTED_AT, kind: "exception", summary: "TypeError", detail: "at render" }
        ];

        const text = composePlainReport(buildPayload({ events }));

        expect(text).toContain("-0.0s  error  TypeError\n    at render");
    });

    it("pads offsets so the labels line up", () => {
        const events = [
            { at: REPORTED_AT - 14_300, kind: "route", summary: "Opened /" },
            { at: REPORTED_AT - 6_600, kind: "click", summary: "Submit" }
        ];

        const text = composePlainReport(buildPayload({ events }));

        expect(text).toContain("-14.3s  nav    Opened /\n -6.6s  click  Submit");
    });

    it("starts with the environment when nothing was typed", () => {
        const text = composePlainReport(buildPayload({ description: "" }));

        expect(text.startsWith("Environment\n")).toBe(true);
    });

    it("keeps every recorded event, since nothing has to fit in a URL", () => {
        const events = Array.from({ length: 100 }, (_, index) => {
            return { at: REPORTED_AT - index, kind: "click", summary: `button ${index}` };
        });

        const text = composePlainReport(buildPayload({ events }));

        expect(text).toContain("button 0");
        expect(text).toContain("button 99");
    });

    it("asks for the screenshots to be pasted when some were attached", () => {
        const screenshots = [{ mediaType: "image/png", base64: "AAAA" }];

        const text = composePlainReport(buildPayload({ screenshots }));

        expect(text).toContain("1 screenshot(s) attached in the dialog.");
        expect(text).not.toContain("AAAA");
    });

    it("says nothing about screenshots when there are none", () => {
        expect(composePlainReport(buildPayload())).not.toContain("screenshot");
    });
});
