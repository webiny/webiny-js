import { describe, expect, it } from "vitest";
import { CRAWL_CACHE_MAX_AGE_DAYS } from "./abstractions.js";

/**
 * The cache lifetime and the S3 lifecycle rule have to agree.
 *
 * They live in different packages — this constant here, the rule in `CoreFileManager.ts` — so nothing
 * but a test stops them drifting apart. If they do, a cached crawl outlives the screenshots it points
 * at and the model is silently asked to judge a site it cannot see.
 */
describe("CRAWL_CACHE_MAX_AGE_DAYS", () => {
    it("matches the S3 lifecycle rule on the theme-extraction prefix", () => {
        // packages/project-aws/src/pulumi/apps/core/CoreFileManager.ts — expiration.days
        const LIFECYCLE_RULE_DAYS = 7;

        expect(CRAWL_CACHE_MAX_AGE_DAYS).toBe(LIFECYCLE_RULE_DAYS);
    });

    it("is long enough to be worth caching and short enough to stay fresh", () => {
        expect(CRAWL_CACHE_MAX_AGE_DAYS).toBeGreaterThanOrEqual(1);
        expect(CRAWL_CACHE_MAX_AGE_DAYS).toBeLessThanOrEqual(30);
    });
});
