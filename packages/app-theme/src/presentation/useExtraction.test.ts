import { describe, expect, it } from "vitest";
import {
    EXTRACTION_DONE_ACTION,
    EXTRACTION_FAILED_ACTION,
    EXTRACTION_PROGRESS_ACTION
} from "./useExtraction.js";

/**
 * The websocket action names are duplicated on purpose — importing them from
 * `@webiny/api-theme-extraction` would drag puppeteer's dependency graph into the Admin bundle for the
 * sake of three strings. That trade is only safe if something catches the two sides drifting, because the
 * failure mode is silent: the extraction runs, the server publishes progress, and the dialog sits at 0%
 * for five minutes.
 */
describe("extraction websocket actions", () => {
    it("matches the actions the API publishes", () => {
        // packages/api-theme-extraction/src/features/progress/ExtractionProgress.ts
        expect(EXTRACTION_PROGRESS_ACTION).toBe("theme.extraction.progress");
        expect(EXTRACTION_FAILED_ACTION).toBe("theme.extraction.failed");
        expect(EXTRACTION_DONE_ACTION).toBe("theme.extraction.done");
    });

    it("keeps the three actions distinct", () => {
        const actions = [
            EXTRACTION_PROGRESS_ACTION,
            EXTRACTION_FAILED_ACTION,
            EXTRACTION_DONE_ACTION
        ];

        expect(new Set(actions).size).toBe(actions.length);
    });
});
