/**
 * `@webiny/api-theme-extraction` — generates a theme by analysing an existing website.
 *
 * Phase one crawls and produces a structured inventory; phase two sends it to a model and writes a
 * draft theme. Everything exported here is the deterministic half: URL selection, frequency counting
 * and palette quantisation. Keeping it pure makes cost predictable, results repeatable, and a
 * surprising theme traceable to the numbers rather than to the model.
 */

export * from "./crawl/urlScoring.js";
export * from "./crawl/inventory.js";
export * from "./crawl/samplePage.js";
export * from "./crawl/toObservations.js";
export * from "./model/payload.js";
export * from "./domain/abstractions.js";

/**
 * The browser-adjacent decisions — robots.txt, bot-wall detection, launch resolution, timeouts — are
 * exported here because they are pure and worth reusing. `ChromiumBrowserProvider` deliberately is
 * not: importing it pulls in puppeteer-core, and nothing that only needs to score a URL should pay
 * for the driver. Reach for it at
 * `@webiny/api-theme-extraction/browser/ChromiumBrowserProvider.js`.
 */
export * from "./browser/robots.js";
export * from "./browser/botChallenge.js";
export * from "./browser/launchConfig.js";
export * from "./browser/withTimeout.js";
export * from "./browser/dismissBanners.js";

export * from "./http/fetchRobots.js";
export * from "./model/tokenAssignment.js";
export * from "./model/applyAssignment.js";
export * from "./model/prompt.js";
export * from "./features/shared/abstractions.js";
export * from "./features/shared/errors.js";
export * from "./features/progress/ExtractionProgress.js";
export * from "./features/crawl/abstractions.js";
export * from "./features/analyse/abstractions.js";
