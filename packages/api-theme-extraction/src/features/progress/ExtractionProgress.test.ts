import { describe, expect, it } from "vitest";
import {
    describeStep,
    EXTRACTION_STEPS,
    progressPercent,
    type ExtractionStep
} from "./ExtractionProgress.js";

describe("progressPercent", () => {
    it("starts at zero and ends at one hundred", () => {
        expect(progressPercent({ step: "queued" })).toBe(0);
        expect(progressPercent({ step: "done" })).toBe(100);
    });

    it("never goes backwards across the step sequence", () => {
        // The bar regressing is the clearest possible signal that something is wrong, so it must not
        // happen while things are going right.
        let previous = -1;
        for (const step of EXTRACTION_STEPS) {
            const percent = progressPercent({ step });
            expect(percent, step).toBeGreaterThanOrEqual(previous);
            previous = percent;
        }
    });

    it("never reports one hundred before it is actually done", () => {
        // A bar sitting at 100% while work continues reads as a hang.
        for (const step of EXTRACTION_STEPS.filter(s => s !== "done")) {
            expect(progressPercent({ step, pagesDone: 99, pagesTotal: 5 }), step).toBeLessThan(100);
        }
    });

    it("moves per page while crawling", () => {
        const at = (pagesDone: number) =>
            progressPercent({ step: "crawling", pagesDone, pagesTotal: 5 });

        expect(at(0)).toBeLessThan(at(1));
        expect(at(1)).toBeLessThan(at(3));
        expect(at(3)).toBeLessThan(at(5));
    });

    it("gives crawling the largest share, so the bar is not frozen through it", () => {
        const crawlStart = progressPercent({ step: "crawling", pagesDone: 0, pagesTotal: 5 });
        const crawlEnd = progressPercent({ step: "crawling", pagesDone: 5, pagesTotal: 5 });

        expect(crawlEnd - crawlStart).toBeGreaterThan(50);
    });

    it("does not exceed the crawl's own share when more pages arrive than planned", () => {
        const analysing = progressPercent({ step: "analysing" });

        expect(
            progressPercent({ step: "crawling", pagesDone: 50, pagesTotal: 5 })
        ).toBeLessThanOrEqual(analysing);
    });

    it("handles crawling with no page count yet", () => {
        expect(() => progressPercent({ step: "crawling" })).not.toThrow();
        expect(progressPercent({ step: "crawling" })).toBeGreaterThan(0);
    });

    it("survives a zero page total without dividing by zero", () => {
        expect(progressPercent({ step: "crawling", pagesDone: 0, pagesTotal: 0 })).toBeGreaterThan(
            0
        );
    });
});

describe("describeStep", () => {
    it("names the user's site, not our pipeline", () => {
        expect(describeStep({ step: "checking-rules", host: "northbeam.io" })).toContain(
            "northbeam.io"
        );
    });

    it("names the page being read, which is what makes a long step feel alive", () => {
        const message = describeStep({
            step: "crawling",
            currentUrl: "https://northbeam.io/pricing",
            pagesDone: 1,
            pagesTotal: 5
        });

        expect(message).toContain("https://northbeam.io/pricing");
        expect(message).toContain("page 2 of 5");
    });

    it("does not count past the total", () => {
        expect(describeStep({ step: "crawling", pagesDone: 5, pagesTotal: 5 })).toContain(
            "page 5 of 5"
        );
    });

    it("falls back gracefully with no host", () => {
        expect(describeStep({ step: "checking-rules" })).toContain("the site");
    });

    it("has a message for every step", () => {
        for (const step of EXTRACTION_STEPS) {
            const message = describeStep({ step: step as ExtractionStep });
            expect(message, step).toBeTruthy();
            expect(message.length, step).toBeGreaterThan(3);
        }
    });

    it("avoids implementation words a user would not recognise", () => {
        for (const step of EXTRACTION_STEPS) {
            const message = describeStep({ step: step as ExtractionStep }).toLowerCase();
            for (const jargon of ["payload", "quantise", "dtcg", "token", "lambda", "chromium"]) {
                expect(message, `${step} mentions "${jargon}"`).not.toContain(jargon);
            }
        }
    });
});
