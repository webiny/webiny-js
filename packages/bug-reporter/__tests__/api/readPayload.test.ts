import { describe, it, expect } from "vitest";
import { readPayload } from "~/api/readPayload.js";

const ENVIRONMENT = {
    url: "https://admin.example.com/pages",
    page: "Pages",
    userAgent: "Mozilla/5.0",
    viewport: "1440x900",
    language: "en-US",
    timezone: "Europe/Zagreb",
    capturedAt: "2026-09-18T10:00:00.000Z"
};

describe("readPayload", () => {
    it.each([[null], [undefined], ["a string"], [42], [{}], [{ environment: "nope" }]])(
        "rejects %j, which is not shaped like a report",
        body => {
            expect(readPayload(body)).toBeNull();
        }
    );

    it("reads a well-formed report", () => {
        const payload = readPayload({
            description: "  it broke  ",
            reportedAt: 123,
            events: [{ at: 1, kind: "click", summary: "Publish", detail: "button" }],
            environment: ENVIRONMENT,
            screenshots: [{ mediaType: "image/png", base64: "AA" }]
        });

        expect(payload).toEqual({
            description: "it broke",
            reportedAt: 123,
            events: [{ at: 1, kind: "click", summary: "Publish", detail: "button" }],
            environment: ENVIRONMENT,
            screenshots: [{ mediaType: "image/png", base64: "AA" }]
        });
    });

    /*
     * Everything here is rendered straight into issue markdown. A non-string field used to arrive as
     * "[object Object]" in front of whoever triages the report.
     */
    it("blanks environment fields that are not strings rather than rendering them", () => {
        const payload = readPayload({
            environment: { ...ENVIRONMENT, page: { evil: true }, url: 7 }
        });

        expect(payload?.environment.page).toBe("");
        expect(payload?.environment.url).toBe("");
        expect(payload?.environment.viewport).toBe("1440x900");
    });

    it("drops malformed events but keeps the rest of the report", () => {
        const payload = readPayload({
            events: [null, "nope", { kind: "click" }, { at: 1, kind: "click", summary: "ok" }],
            environment: ENVIRONMENT
        });

        expect(payload?.events).toEqual([{ at: 1, kind: "click", summary: "ok" }]);
    });

    it("drops screenshots in a media type GitHub would not render", () => {
        const payload = readPayload({
            environment: ENVIRONMENT,
            screenshots: [
                { mediaType: "text/html", base64: "AA" },
                { mediaType: "image/png", base64: "BB" }
            ]
        });

        expect(payload?.screenshots).toEqual([{ mediaType: "image/png", base64: "BB" }]);
    });

    it("caps the screenshots and the description", () => {
        const screenshots = Array.from({ length: 25 }, () => ({
            mediaType: "image/png",
            base64: "AA"
        }));

        const payload = readPayload({
            description: "x".repeat(10000),
            environment: ENVIRONMENT,
            screenshots
        });

        expect(payload?.screenshots).toHaveLength(10);
        expect(payload?.description).toHaveLength(4000);
    });

    it("keeps an empty report, because whether it is worth filing is not its call", () => {
        const payload = readPayload({ environment: ENVIRONMENT });

        expect(payload?.description).toBe("");
        expect(payload?.screenshots).toEqual([]);
    });
});
