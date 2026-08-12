/**
 * `@webiny/site-capture` — headless-browser capture primitives.
 *
 * The generic half of what theme extraction pioneered: launch a browser on the Chromium Lambda layer,
 * run a fixed per-page visit sequence (viewport, media interception, navigation, settle, bot-wall
 * check, consent dismissal), take screenshots, and hand the page to a pluggable in-page evaluator.
 * What a consumer wants *out of* the page — token samples, DOM segments — is theirs to supply.
 *
 * The pure, browser-adjacent decisions (launch resolution, timeouts, bot-wall detection, consent
 * dismissal) are exported here because they are testable without a browser. `ChromiumBrowserProvider`
 * deliberately is not: importing it pulls in puppeteer-core, and nothing that only needs those pure
 * helpers should pay for the driver. Reach for it at
 * `@webiny/site-capture/browser/ChromiumBrowserProvider.js`, and the S3 screenshot store at
 * `@webiny/site-capture/storage/S3ScreenshotStore.js`.
 */

export * from "./abstractions.js";
export * from "./errors.js";
export * from "./browser/launchConfig.js";
export * from "./browser/botChallenge.js";
export * from "./browser/dismissBanners.js";
export * from "./browser/withTimeout.js";
