import { describe, expect, it } from "vitest";
import { describeCrawlProgress, needsThemeExtraction, themeGateMessage } from "./themeStep.js";

describe("describeCrawlProgress", () => {
    it("counts pages finished, not the page in hand, and names the page being read", () => {
        expect(
            describeCrawlProgress({
                pagesDone: 2,
                pagesTotal: 5,
                currentUrl: "https://site.com/floor-plans"
            })
        ).toBe("read 2 of 5 pages, now reading /floor-plans");
        expect(describeCrawlProgress({ pagesDone: 2, pagesTotal: 2 })).toBe("read 2 of 2 pages");
    });
});

describe("themeGateMessage", () => {
    const job = (
        themeEntryId: string,
        themeExtraction: Parameters<typeof themeGateMessage>[0]["themeExtraction"]
    ) => ({
        themeEntryId,
        themeExtraction
    });

    it("lets a job with a pinned theme through", () => {
        expect(themeGateMessage(job("abc", null))).toBeNull();
    });

    it("says what extraction is doing while it runs", () => {
        expect(
            themeGateMessage(
                job("", {
                    status: "running",
                    step: "read 2 of 5 pages, now reading /floor-plans",
                    error: null
                })
            )
        ).toBe(
            "The job's theme is still being extracted (read 2 of 5 pages, now reading /floor-plans). Cluster can run once it is published and pinned."
        );
    });

    it("gives the reason and both ways on when extraction failed", () => {
        expect(
            themeGateMessage(
                job("", { status: "failed", step: "failed", error: "site unreachable" })
            )
        ).toBe(
            "This job's theme could not be extracted (site unreachable). Retry it, or pick an existing theme."
        );
    });

    it("says another extraction holds the lock", () => {
        expect(
            themeGateMessage(
                job("", {
                    status: "waiting",
                    step: "waiting for another theme extraction to finish",
                    error: null
                })
            )
        ).toContain("waiting for another theme extraction to finish");
    });
});

describe("needsThemeExtraction", () => {
    it("starts extraction for a job without a theme, again after a failure, never while one runs", () => {
        expect(needsThemeExtraction({ themeEntryId: "", themeExtraction: null })).toBe(true);
        expect(
            needsThemeExtraction({ themeEntryId: "", themeExtraction: { status: "failed" } })
        ).toBe(true);
        expect(
            needsThemeExtraction({ themeEntryId: "", themeExtraction: { status: "running" } })
        ).toBe(false);
        expect(needsThemeExtraction({ themeEntryId: "abc", themeExtraction: null })).toBe(false);
    });
});
