import { describe, it, expect } from "vitest";
import { buildComposeUrl } from "~/api/buildComposeUrl.js";
import type { IBuildComposeUrlInput } from "~/api/buildComposeUrl.js";
import type { IBugReportPayload } from "~/shared/types.js";
import type { IReportedEvent } from "~/shared/types.js";

const REPORTED_AT = 1_000_000;

const PAYLOAD: IBugReportPayload = {
    description: "Publishing does nothing.",
    reportedAt: REPORTED_AT,
    events: [],
    environment: {
        url: "https://admin.example.com/pages",
        page: "Pages",
        userAgent: "Mozilla/5.0",
        viewport: "1440x900",
        language: "en-US",
        timezone: "Europe/Zagreb",
        capturedAt: "2026-09-18T10:00:00.000Z"
    },
    screenshots: []
};

function buildInput(payload: Partial<IBugReportPayload> = {}): IBuildComposeUrlInput {
    return {
        repository: "webiny/webiny-js",
        labels: ["bug"],
        draft: {
            title: "Publish fails",
            summary: "Publishing a page does nothing.",
            stepsToReproduce: [],
            expected: "",
            actual: ""
        },
        payload: { ...PAYLOAD, ...payload }
    };
}

function readBody(url: string): string {
    const body = new URL(url).searchParams.get("body");
    return body ?? "";
}

/* Chronological, oldest first, which is the order the recorder appends them in. */
function buildEvents(count: number): IReportedEvent[] {
    const events: IReportedEvent[] = [];
    for (let index = 0; index < count; index++) {
        const at = REPORTED_AT - (count - index) * 1000;
        events.push({ at, kind: "click", summary: `Button ${index}` });
    }
    return events;
}

describe("buildComposeUrl", () => {
    it("points at the repository's issue composer with the title and labels prefilled", () => {
        const url = new URL(buildComposeUrl(buildInput()));

        expect(url.origin + url.pathname).toBe("https://github.com/webiny/webiny-js/issues/new");
        expect(url.searchParams.get("title")).toBe("Publish fails");
        expect(url.searchParams.get("labels")).toBe("bug");
    });

    /* Images cannot ride in a query string, so the reporter has to be told to paste theirs. */
    it("asks for the screenshot back only when there was one", () => {
        const withImage = readBody(
            buildComposeUrl(buildInput({ screenshots: [{ mediaType: "image/png", base64: "AA" }] }))
        );
        expect(withImage).toContain("Paste your screenshot here");

        expect(readBody(buildComposeUrl(buildInput()))).not.toContain("Paste your screenshot here");
    });

    it("keeps the recent end of a long timeline", () => {
        const body = readBody(buildComposeUrl(buildInput({ events: buildEvents(200) })));

        expect(body).toContain("Button 199");
        expect(body).not.toContain("Button 0 ");
    });

    /*
     * The failure this guards against is silent: an over-long URL opens the tab and then loses the
     * whole report to a GitHub error page.
     */
    it("trims the body until the whole URL fits", () => {
        const url = buildComposeUrl(
            buildInput({ description: "x/".repeat(20000), events: buildEvents(200) })
        );

        expect(url.length).toBeLessThanOrEqual(8000);
        expect(readBody(url)).toContain("Trimmed to fit a URL");
    });

    it("leaves a report that already fits alone", () => {
        expect(readBody(buildComposeUrl(buildInput()))).not.toContain("Trimmed to fit a URL");
    });
});
