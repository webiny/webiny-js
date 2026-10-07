import { existsSync } from "node:fs";
import chromium from "@sparticuz/chromium-min";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { createImplementation } from "@webiny/feature/api";
import {
    BrowserProvider as BrowserProviderAbstraction,
    type CapturePageParams,
    type CaptureResult,
    type FontLoadingReport,
    type FontResource,
    type IBrowserSession,
    type RenderPageParams,
    type RenderResult,
    type Screenshot,
    type ScreenshotCrop
} from "~/abstractions.js";
import { clearOverlaysScript, type OverlayClearanceResult } from "./clearOverlays.js";
import { createImageCollector } from "./collectPageImages.js";
import { BotChallengeError, detectBotChallenge } from "./botChallenge.js";
import {
    ChromiumNotFoundError,
    DEFAULT_TIMEOUTS,
    isResolved,
    LAYER_EXECUTABLE_CANDIDATES,
    LAYER_PACK_CANDIDATES,
    mergeLaunchArgs,
    resolveExecutablePath,
    resolvePackPath,
    resolveUserAgent,
    type ChromiumConfig
} from "./launchConfig.js";
import { withTimeout, withTimeoutOrDefault } from "./withTimeout.js";
import {
    FREEZE_MOTION_CSS,
    finishAnimationsScript,
    fontLoadingScript,
    summarizeFontFaces,
    settleAtTopScript,
    type ObservedFontFace
} from "./stabilize.js";
import {
    PAGE_HEIGHT_EXPRESSION,
    placeTiles,
    planTiles,
    restoreShiftScript,
    shiftScript,
    stitchTiles,
    tileShift,
    type ShotTile
} from "./stitch.js";

// A page in an error loop can log thousands of lines; enough to diagnose, not enough to drown a
// task log. Each message is truncated too — a stack trace is rarely informative past its first line.
// A component taller than this is a page, not a component; the cap keeps one runaway render from
// producing an image nothing can open.
const MAX_RENDER_HEIGHT = 20000;
const MAX_PAGE_ERRORS = 20;
const PAGE_ERROR_MAX_CHARS = 300;

/**
 * Headless Chromium, driven by puppeteer-core against the `chromium` Lambda layer.
 *
 * This is deliberately thin. Everything decidable — which URLs to visit, how to weight what we find,
 * whether a page is a bot wall, what robots.txt permits — lives in the pure modules alongside it and
 * is unit tested. What is left here is the part that genuinely needs a browser, because it is also the
 * part that cannot be tested without one.
 *
 * Two constraints shape the rest: the binary's location inside the layer is unverified until the first
 * deploy, so every path is overridable and failures report what was tried; and nothing may hang, so
 * every driver call is wrapped in a timeout that names the operation.
 */

/**
 * The tallest stitched full-page image. Each tile is one viewport, so this bounds tile count and the
 * stitched canvas (1440 x 32000 RGBA is ~180 MB while compositing), not the painted surface. A taller
 * page is cut here and the screenshot records how tall it really was.
 */
const MAX_STITCHED_HEIGHT = 32000;
/** Per tile, after the shift: enough for the moved content to paint, short enough for a 35-tile page. */
const TILE_SETTLE_MS = 150;
/** A stitched shot is dozens of screenshots, not one; the single-shot ceiling does not fit it. */
const FULL_PAGE_SCREENSHOT_MS = 45_000;
/** Bounded like `pageErrors`: a gallery of broken images should not fill the record. */
const MAX_FAILED_IMAGE_REQUESTS = 10;
/** Fraction of the viewport to scroll for the mid-page crop. */
const MID_PAGE_SCROLL_FACTOR = 1.5;

const CROP_LABELS: Record<ScreenshotCrop, string> = {
    "above-fold": "top of the page",
    "mid-page": "middle of the page",
    footer: "bottom of the page",
    "full-page": "the full page"
};

const noClearance = (): OverlayClearanceResult => ({
    hidden: [],
    dismissed: [],
    removed: [],
    unlockedScroll: false,
    overlayRemains: null
});

/**
 * How far to step down the page, as a fraction of the viewport, and how long to pause on each step.
 *
 * A lazy loader fires from an IntersectionObserver, so a step has to leave the element on screen long
 * enough for the callback to run and the request to start. Overlapping the steps slightly means no
 * band of the page is skipped between two scroll positions.
 */
const LAZY_SCROLL_FACTOR = 0.8;
const LAZY_SCROLL_PAUSE_MS = 150;
const LAZY_SCROLL_SETTLE_MS = 600;
/** Enough for a very long page at a 900px viewport; past this the page is pathological. */
const MAX_LAZY_SCROLL_STEPS = 40;
/** Back at the top: how long the page must stop changing classes and styles, and the most to wait. */
const SETTLE_QUIET_MS = 400;
const SETTLE_MAX_MS = 2500;

/**
 * Walk the page once so that whatever loads on scroll has loaded before anything is read.
 *
 * The tree used to be read off a page that had never been scrolled, while the screenshots were taken
 * afterwards from a grown viewport — which is itself what triggers a lazy loader. So the camera saw
 * the page and the sampler saw its placeholders, and nothing downstream could tell.
 *
 * Measured on one site: Park city's hero carries `class="lazy-background-images"` and
 * `style="background-color: #a65f46"`, and its photograph only attaches on scroll. The capture
 * recorded the placeholder terracotta as the section's largest colour, Plan bound the section
 * background to it, and a dark blue hero was generated as a flat terracotta block. On the home page
 * alone, elements with a `url(...)` background go from 2 to 6 across this pass, and section-sized
 * ones from 0 to 3. `<img>` elements are unaffected — Chrome loads those regardless.
 *
 * The page is returned to the top before anything is read, so sticky offsets and viewport-relative
 * layout are where they were. Best-effort by construction: a page that cannot be scrolled, or that
 * throws while scrolling, is read exactly as it was before.
 */
const settleLazyContent = async (page: Page): Promise<void> => {
    await withTimeoutOrDefault(
        "scroll the page so lazy content loads",
        DEFAULT_TIMEOUTS.evaluateMs,
        undefined,
        () =>
            page.evaluate(
                async (factor: number, pause: number, settle: number, maxSteps: number) => {
                    const step = Math.max(1, Math.round(window.innerHeight * factor));
                    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
                    for (let i = 0; i < maxSteps; i++) {
                        const y = i * step;
                        if (y > document.documentElement.scrollHeight) {
                            break;
                        }
                        window.scrollTo(0, y);
                        await wait(pause);
                    }
                    window.scrollTo(0, 0);
                    await wait(settle);
                },
                LAZY_SCROLL_FACTOR,
                LAZY_SCROLL_PAUSE_MS,
                LAZY_SCROLL_SETTLE_MS,
                MAX_LAZY_SCROLL_STEPS
            ) as Promise<void>
    );
    // Back at the top, the page's own scroll state has to catch up too — see `settleAtTopScript`.
    await withTimeoutOrDefault("settle at the top", DEFAULT_TIMEOUTS.evaluateMs, undefined, () =>
        page.evaluate(settleAtTopScript(SETTLE_QUIET_MS, SETTLE_MAX_MS)).then(() => undefined)
    );
};

const finishAnimations = async (page: Page): Promise<void> => {
    await withTimeoutOrDefault(
        "finish running animations",
        DEFAULT_TIMEOUTS.evaluateMs,
        undefined,
        () => page.evaluate(finishAnimationsScript()).then(() => undefined)
    );
};

/** Best-effort: a page that refuses the stylesheet is read as it is, not failed. */
const freezeMotion = async (page: Page): Promise<void> => {
    await withTimeoutOrDefault("freeze motion", DEFAULT_TIMEOUTS.evaluateMs, undefined, () =>
        page.addStyleTag({ content: FREEZE_MOTION_CSS }).then(() => undefined)
    );
    await finishAnimations(page);
};

/**
 * Waits for the page's fonts, bounded, and reports the faces that did not make it. The evaluate is
 * given the wait plus a margin so the in-page timeout, not ours, decides "not ready".
 */
const waitForFonts = async (page: Page, timeoutMs: number): Promise<FontLoadingReport> => {
    const observed = await withTimeoutOrDefault<{
        ready: boolean;
        faces: ObservedFontFace[];
    } | null>(
        "wait for web fonts",
        timeoutMs + 5000,
        null,
        () =>
            page.evaluate(fontLoadingScript(timeoutMs)) as Promise<{
                ready: boolean;
                faces: ObservedFontFace[];
            }>
    );
    if (!observed) {
        return { ready: false, failed: [], pending: [] };
    }
    return summarizeFontFaces(observed.faces ?? [], Boolean(observed.ready));
};

const clearOverlays = (page: Page): Promise<OverlayClearanceResult> => {
    return withTimeoutOrDefault<OverlayClearanceResult>(
        "clear popups and overlays",
        DEFAULT_TIMEOUTS.bannerMs,
        noClearance(),
        () => page.evaluate(clearOverlaysScript()) as Promise<OverlayClearanceResult>
    );
};

/**
 * Resolves the executable, falling back to unpacking a compressed layer.
 *
 * The candidate scan comes first because an already-extracted binary costs nothing, whereas
 * `chromium-min` unpacks into /tmp on every cold start.
 */
export interface ExecutableDiagnostics {
    executablePath: string;
    /** Which branch supplied it: config, environment, a layer candidate, or unpacking. */
    source: string;
    /** Everything probed before the winner, so a wrong layout is legible from the log alone. */
    tried: string[];
    unpackError?: string;
}

/**
 * Reconciles `chromium-min@123` with the Lambda runtime Webiny actually uses.
 *
 * `chromium-min@123` recognises only the literal `nodejs20.x` runtime as Amazon Linux 2023; every
 * other runtime it maps to AL2, extracting the AL2 system libraries and pointing `LD_LIBRARY_PATH` at
 * `/tmp/al2/lib`. Webiny runs a newer AL2023 runtime (nodejs24.x), so left alone it links the wrong
 * libs and Chromium dies with "libnspr4.so: cannot open shared object file".
 *
 * On any AL2023 runtime (node >= 20) inside Lambda we therefore signal `nodejs20.x` — the only lever
 * this version exposes — so the AL2023 packs are inflated, and we prepend their directory to the
 * loader path (the module-load default may already have set `/tmp/al2/lib`). Runtimes < 20 are left
 * alone: node18 genuinely is AL2. Remove once the chromium layer + `chromium-min` are bumped to a
 * version that recognises the newer runtimes directly.
 */
const alignChromiumRuntimeLibraries = (): void => {
    const inLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
    const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
    if (!inLambda || !Number.isFinite(nodeMajor) || nodeMajor < 20) {
        return;
    }

    process.env.AWS_LAMBDA_JS_RUNTIME = "nodejs20.x";

    const al2023Lib = "/tmp/al2023/lib";
    const current = process.env.LD_LIBRARY_PATH ?? "";
    if (!current.split(":").includes(al2023Lib)) {
        process.env.LD_LIBRARY_PATH = current ? `${al2023Lib}:${current}` : al2023Lib;
    }
};

const findExecutable = async (config?: ChromiumConfig): Promise<ExecutableDiagnostics> => {
    alignChromiumRuntimeLibraries();

    const resolution = resolveExecutablePath({
        config,
        exists: existsSync,
        candidates: LAYER_EXECUTABLE_CANDIDATES
    });

    if (isResolved(resolution)) {
        return {
            executablePath: resolution.path,
            source: resolution.source,
            tried: resolution.tried
        };
    }

    // No ready binary, so inflate the layer's compressed pack. Prefer an explicit override
    // (config/env), then the first pack directory that exists — the @sparticuz/chromium layer's
    // `bin/`. `chromium-min` wants that directory, not a file, and unpacks it into /tmp.
    const packPath = resolvePackPath(config) ?? LAYER_PACK_CANDIDATES.find(dir => existsSync(dir));
    let unpackError: string | undefined;

    try {
        const unpacked = await withTimeout(
            "unpack the Chromium layer",
            DEFAULT_TIMEOUTS.launchMs,
            () => chromium.executablePath(packPath)
        );

        if (unpacked) {
            return {
                executablePath: unpacked,
                source: "unpacked",
                tried: resolution.tried
            };
        }
    } catch (error) {
        // Carried into the error rather than swallowed: "the layer is missing" and "the layer is there
        // but would not unpack" need different fixes, and only this distinguishes them.
        unpackError = error instanceof Error ? error.message : String(error);
    }

    throw new ChromiumNotFoundError([
        ...resolution.tried,
        packPath ? `unpacking ${packPath}` : "unpacking the default pack location",
        ...(unpackError ? [`(unpacking failed: ${unpackError})`] : [])
    ]);
};

class ChromiumSession implements IBrowserSession {
    constructor(
        private browser: Browser,
        private userAgent: string,
        readonly diagnostics: Record<string, unknown>
    ) {}

    async capture<TResult>(params: CapturePageParams): Promise<CaptureResult<TResult>> {
        // A page per capture, closed afterwards. Reusing one page across a crawl leaks the previous
        // page's listeners and hidden-banner styles into the next one's sample.
        const page = await withTimeout("open a browser tab", DEFAULT_TIMEOUTS.launchMs, () =>
            this.browser.newPage()
        );

        try {
            // The whole page is bounded, not just its parts: navigation can finish quickly and then a
            // heavy page can spend a long time in the evaluator.
            return await withTimeout(`read ${params.url}`, params.timeoutMs, () =>
                this.capturePage<TResult>(page, params)
            );
        } finally {
            await withTimeoutOrDefault(
                "close the browser tab",
                DEFAULT_TIMEOUTS.closeMs,
                undefined,
                () => page.close()
            );
        }
    }

    async render(params: RenderPageParams): Promise<RenderResult> {
        const page = await withTimeout("open a browser tab", DEFAULT_TIMEOUTS.launchMs, () =>
            this.browser.newPage()
        );
        try {
            return await withTimeout(`render ${params.url}`, params.timeoutMs, () =>
                this.renderPage(page, params)
            );
        } finally {
            await withTimeoutOrDefault(
                "close the browser tab",
                DEFAULT_TIMEOUTS.closeMs,
                undefined,
                () => page.close()
            );
        }
    }

    private async renderPage(page: Page, params: RenderPageParams): Promise<RenderResult> {
        await page.setUserAgent(this.userAgent);
        await page.setViewport({
            width: params.viewportWidth,
            height: params.viewportHeight,
            deviceScaleFactor: 1
        });

        /*
         * What the page says about itself, kept so a failure can be explained rather than guessed at.
         * Attached before navigating so nothing said during load is missed.
         */
        const pageErrors: string[] = [];
        const noteError = (message: string) => {
            if (pageErrors.length < MAX_PAGE_ERRORS) {
                pageErrors.push(message.slice(0, PAGE_ERROR_MAX_CHARS));
            }
        };
        page.on("pageerror", error => noteError(error.message));
        page.on("console", message => {
            if (message.type() === "error") {
                noteError(message.text());
            }
        });

        /*
         * Image requests that never arrived.
         *
         * A generated component can read a file input's value bare — the value is `{ url }`, so
         * `url(${img.src})` becomes `url([object Object])` — and the browser then requests a URL that
         * cannot resolve. Nothing else notices: the bundle builds, the text is all present, the props
         * conform and the colours are variables, so every validator passes and the render is recorded
         * `ok`. The only witness is the browser, which asked for the image and got nothing.
         *
         * Collected from the driver rather than from the page because a CSS background image leaves no
         * element to interrogate — `naturalWidth` answers for `<img>` and says nothing about a
         * `background-image` that 404'd.
         */
        const failedImageRequests: string[] = [];
        const noteFailedRequest = (url: string, resourceType: string) => {
            if (resourceType !== "image" && resourceType !== "stylesheet") {
                return;
            }
            if (resourceType === "stylesheet") {
                return;
            }
            if (failedImageRequests.length < MAX_FAILED_IMAGE_REQUESTS) {
                failedImageRequests.push(url.slice(0, PAGE_ERROR_MAX_CHARS));
            }
        };
        page.on("requestfailed", request => {
            noteFailedRequest(request.url(), request.resourceType());
        });
        page.on("response", response => {
            if (response.status() >= 400) {
                noteFailedRequest(response.url(), response.request().resourceType());
            }
        });

        await withTimeout(`navigate to ${params.url}`, DEFAULT_TIMEOUTS.navigationMs, () =>
            page.goto(params.url, { waitUntil: "domcontentloaded" })
        );

        // Push the content in (a bundle + theme, via postMessage) once the render host is loaded.
        await withTimeout(`inject into ${params.url}`, DEFAULT_TIMEOUTS.evaluateMs, () =>
            page.evaluate(params.inject)
        );

        // Wait until the injected content has actually mounted before shooting — the host renders
        // asynchronously after receiving the bundle, so a screenshot taken now would be blank.
        try {
            await page.waitForFunction(params.waitFor, {
                timeout: DEFAULT_TIMEOUTS.navigationMs,
                polling: 100
            });
        } catch (error) {
            // The page's own errors are the useful part of this failure — a bare "waiting failed"
            // says the render host never signalled, not why, and the why was already on the page.
            const detail = pageErrors.length
                ? ` The page reported: ${pageErrors.join(" | ")}`
                : " The page reported no errors, so it loaded but never signalled ready.";
            throw new Error(`${error instanceof Error ? error.message : String(error)}.${detail}`);
        }

        // A short settle so late fonts/images paint.
        await new Promise(resolve => setTimeout(resolve, params.settleMs ?? 400));

        const documentHeight = await this.documentHeight(page);

        /*
         * Shrink the viewport to the content before shooting.
         *
         * A rendered component is as tall as it is — a navigation header is 78px — but a full-page
         * screenshot is never shorter than the viewport, so it came back 1440x900 with the component
         * in the top sliver and the rest white. Scaled into a preview tile that reads as an empty
         * box, which is how a working render still looked broken. The source crop it sits beside is
         * sized to its content, so matching that is also what makes the two comparable.
         *
         * Height only. Width drives layout and must stay at the capture width or the component would
         * be screenshotted at a size it was never designed against.
         */
        if (documentHeight > 0 && documentHeight !== params.viewportHeight) {
            await page.setViewport({
                width: params.viewportWidth,
                height: Math.min(documentHeight, MAX_RENDER_HEIGHT),
                deviceScaleFactor: 1
            });
            // A beat for the resize to settle before the shot; sticky and viewport-relative styles
            // reflow on it.
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        /*
         * Measured before the screenshot, from the same painted page the screenshot will show, so the
         * numbers and the picture cannot disagree. A measure that throws is not a render failure:
         * the component is on screen either way, and losing the shot over a measurement would trade
         * the primary evidence for the secondary.
         */
        const measurement = params.measure
            ? await page
                  .evaluate(params.measure)
                  .then(value => value as unknown)
                  .catch(() => undefined)
            : undefined;

        const image = await page.screenshot({ type: "png", fullPage: true });
        const bytes = image instanceof Uint8Array ? image : new Uint8Array();
        const bodyPreview =
            documentHeight === 0
                ? await page
                      .evaluate(
                          `document.body ? document.body.innerHTML.slice(0, 1200) : "(no body)"`
                      )
                      .then(value => String(value))
                      .catch(() => undefined)
                : undefined;

        return {
            finalUrl: page.url(),
            image: bytes,
            width: params.viewportWidth,
            height: documentHeight,
            pageErrors,
            failedImageRequests,
            bodyPreview,
            measurement
        };
    }

    private async capturePage<TResult>(
        page: Page,
        params: CapturePageParams
    ): Promise<CaptureResult<TResult>> {
        const fonts = new Map<string, FontResource>();
        // Only when the caller asked: a consumer that wants a screenshot pays none of this.
        const imageCollector = params.collectImages
            ? createImageCollector(params.collectImages)
            : null;

        await page.setUserAgent(this.userAgent);
        await page.setViewport({
            width: params.viewportWidth,
            height: params.viewportHeight,
            deviceScaleFactor: 1
        });

        // One call: each `emulateMediaFeatures` replaces the features the previous call set.
        const mediaFeatures = [
            ...(params.emulateDarkMode ? [{ name: "prefers-color-scheme", value: "dark" }] : []),
            ...(params.stabilize?.freezeMotion
                ? [{ name: "prefers-reduced-motion", value: "reduce" }]
                : [])
        ];
        if (mediaFeatures.length > 0) {
            await page.emulateMediaFeatures(mediaFeatures);
        }

        // Fonts are recorded from the network, not from CSS: an @font-face block proves a declaration,
        // whereas a response proves the browser actually chose and fetched that file.
        page.on("response", response => {
            try {
                const resourceType = response.request().resourceType();
                if (resourceType === "font") {
                    const url = response.url();
                    if (!fonts.has(url)) {
                        fonts.set(url, { url });
                    }
                    return;
                }
                if (imageCollector && resourceType === "image") {
                    // A response from any frame but the page's own belongs to an embed.
                    const embedded = response.frame() !== page.mainFrame();
                    /*
                     * Deliberately not awaited here. The handler is sync and a rejected promise from
                     * it would be unhandled; the collector owns its own bounding and error capture,
                     * and `drain()` below is what waits for the reads to finish.
                     */
                    void imageCollector.offer(response, { embedded }).catch(() => undefined);
                }
            } catch {
                // A response event that outlives its request must not take the page down.
            }
        });

        // Media is the default here — a hero video costs real time and contributes no colours, type or
        // spacing. A caller can widen this to other non-visual, connection-heavy types (websockets,
        // beacons) to keep a heavy page from exhausting the browser's sockets and handles.
        const blocked = new Set(params.blockResourceTypes ?? ["media"]);
        await page.setRequestInterception(true);
        page.on("request", request => {
            if (blocked.has(request.resourceType())) {
                void request.abort().catch(() => undefined);
                return;
            }
            void request.continue().catch(() => undefined);
        });

        // `domcontentloaded` rather than `networkidle`: a single slow third-party script should not
        // cost us the whole page. The settle below is best-effort on top of a page we already hold.
        const response = await withTimeout(
            `navigate to ${params.url}`,
            DEFAULT_TIMEOUTS.navigationMs,
            () => page.goto(params.url, { waitUntil: "domcontentloaded" })
        );

        await withTimeoutOrDefault(
            "wait for the page to settle",
            DEFAULT_TIMEOUTS.navigationMs,
            undefined,
            () => page.waitForNetworkIdle({ idleTime: 500 })
        );

        const status = response?.status() ?? 0;
        const headers = response?.headers() ?? {};
        const title = await withTimeoutOrDefault(
            "read the page title",
            DEFAULT_TIMEOUTS.evaluateMs,
            "",
            () => page.title()
        );

        await this.assertNotChallenged(page, params.url, status, headers, title);

        // Before the lazy scroll, so the entrances that scroll triggers land in their end state too.
        if (params.stabilize?.freezeMotion) {
            await freezeMotion(page);
        }

        /*
         * Before the clearance, so the overlays this scroll provokes are caught by it rather than by
         * the late pass — a scroll-depth promo is exactly what the comment below anticipates, and it
         * should not be allowed to land between the scroll and the sampler.
         */
        await settleLazyContent(page);

        if (params.stabilize?.freezeMotion) {
            // Whatever the scroll started is finished before anything is read.
            await finishAnimations(page);
        }

        // After the scroll, because a lazy section can bring its own fonts with it.
        const fontLoading =
            params.stabilize?.fontsTimeoutMs !== undefined
                ? await waitForFonts(page, params.stabilize.fontsTimeoutMs)
                : undefined;

        // Before sampling, so the sampler's own `display: none` filter excludes whatever was hidden.
        const earlyClearance = await clearOverlays(page);

        // The pluggable seam. The visit sequence above is fixed; what to read off the settled page is
        // the caller's — a token sampler, a DOM/segment sampler — supplied as an in-page script whose
        // return value we hand back untouched as `result`.
        const result = await withTimeout(
            `evaluate ${params.url}`,
            DEFAULT_TIMEOUTS.evaluateMs,
            () => page.evaluate(params.evaluate) as Promise<TResult>
        );

        /*
         * Again, immediately before the screenshots.
         *
         * The first pass runs seconds after navigation, and the overlays that matter most are the ones
         * that are not there yet: a newsletter modal on a three-second timer, an exit-intent layer, a
         * promo that waits for scroll depth. Those arrive between the sampler and the camera, so a
         * single pass leaves the element tree clean and photographs the popup — the worst of both, and
         * a disagreement between the tree and the image that nothing downstream can detect.
         *
         * The pass is idempotent, so on a page that was already clear this costs one evaluate and
         * returns nothing.
         */
        const lateClearance = await clearOverlays(page);

        const screenshots = await this.captureScreenshots(page, params);

        /*
         * After the screenshots, so a body is read while the page is still alive: a response buffer
         * can be discarded once the page navigates or closes.
         */
        const collected = imageCollector
            ? await imageCollector.drain()
            : { images: [], skipped: [] };

        return {
            url: params.url,
            finalUrl: page.url(),
            status,
            title,
            result,
            fontResources: [...fonts.values()],
            images: collected.images,
            skippedImages: collected.skipped,
            screenshots: screenshots.taken,
            failedScreenshots: screenshots.failed,
            // Returned rather than logged here: the caller has its own logger, and this belongs in the
            // consumer's own log where someone debugging a missing element will look for it.
            earlyClearance,
            lateClearance,
            ...(fontLoading ? { fontLoading } : {})
        };
    }

    private async assertNotChallenged(
        page: Page,
        url: string,
        status: number,
        headers: Record<string, string>,
        title: string
    ): Promise<void> {
        // Checked before sampling. A challenge page has a background colour and a font, so left
        // undetected it produces a plausible theme built entirely from Cloudflare's interstitial —
        // and silently returning the wrong answer is worse than failing.
        const html = await withTimeoutOrDefault(
            "read the page HTML",
            DEFAULT_TIMEOUTS.evaluateMs,
            "",
            () => page.content()
        );
        const bodyText = await withTimeoutOrDefault(
            "read the page text",
            DEFAULT_TIMEOUTS.evaluateMs,
            "",
            () => page.evaluate("document.body ? document.body.innerText : ''") as Promise<string>
        );

        const challenge = detectBotChallenge({ status, headers, title, bodyText, html });
        if (challenge.challenged) {
            throw new BotChallengeError(url, challenge);
        }
    }

    private async captureScreenshots(
        page: Page,
        params: CapturePageParams
    ): Promise<{ taken: Screenshot[]; failed: string[] }> {
        const capture = params.screenshots;
        if (!capture) {
            return { taken: [], failed: [] };
        }

        const taken: Screenshot[] = [];
        const failed: string[] = [];

        // Sequentially, like everything else here: a 2 GB Lambda running Chromium has no headroom for
        // concurrent captures, and the failure mode is an OOM kill that loses the whole crawl.
        for (const request of capture.requests) {
            const fullPage = request.crop === "full-page";
            const screenshot = await withTimeoutOrDefault<Screenshot | undefined>(
                `capture "${request.label}" (${CROP_LABELS[request.crop]})`,
                fullPage ? FULL_PAGE_SCREENSHOT_MS : DEFAULT_TIMEOUTS.screenshotMs,
                undefined,
                async () => {
                    if (fullPage) {
                        const stitched = await this.fullPageScreenshot(
                            page,
                            params.viewportWidth,
                            params.viewportHeight
                        );
                        const key = await capture.write(stitched.image, request.label);
                        return {
                            key,
                            label: request.label,
                            width: params.viewportWidth,
                            height: stitched.height,
                            tiles: stitched.tiles,
                            ...(stitched.truncatedAt !== undefined
                                ? { truncatedAt: stitched.truncatedAt }
                                : {})
                        };
                    }

                    await this.scrollForCrop(page, request.crop, params.viewportHeight);
                    const image = await page.screenshot({ type: "png" });
                    const bytes = image instanceof Uint8Array ? image : new Uint8Array();
                    const key = await capture.write(bytes, request.label);

                    return {
                        key,
                        label: request.label,
                        width: params.viewportWidth,
                        height: params.viewportHeight
                    };
                }
            );

            if (screenshot) {
                taken.push(screenshot);
            } else {
                // A missing screenshot is a degraded result, not a failed crawl — but it must not be
                // silent, or the model's input looks complete when it is not.
                failed.push(request.label);
            }
        }

        return { taken, failed };
    }

    /**
     * A full-page screenshot stitched from viewport tiles, at the viewport the page was read at.
     *
     * Not `fullPage: true`: Chrome paints some positioned elements wrongly in that pass — measured on
     * parkcityplace.org, an absolute header lost its logo and every nav item on 6 of 8 pages. Not a
     * viewport grown to the document height either, which is what replaced it: that re-lays the page
     * out at a viewport thousands of pixels tall, so `vh`-sized sections grow, everything below them
     * moves, and the boxes the tree recorded at the real viewport no longer match the picture. See
     * `stitch.ts` for how sticky and fixed elements are kept where the tree recorded them.
     *
     * The page's own state is restored afterwards, whatever happens, so a screenshot request that
     * follows sees the page as it was.
     */
    private async fullPageScreenshot(
        page: Page,
        width: number,
        viewportHeight: number
    ): Promise<{ image: Uint8Array; height: number; tiles: number; truncatedAt?: number }> {
        const measured = await withTimeoutOrDefault(
            "measure the page height",
            DEFAULT_TIMEOUTS.evaluateMs,
            0,
            () => page.evaluate(PAGE_HEIGHT_EXPRESSION) as Promise<number>
        );
        const plan = planTiles(measured, viewportHeight, MAX_STITCHED_HEIGHT);

        const shot: ShotTile[] = [];
        try {
            for (const offset of plan.offsets) {
                const top = tileShift(offset, plan.height, viewportHeight);
                await page.evaluate(shiftScript(top));
                // A beat for the moved content to paint.
                await new Promise(resolve => setTimeout(resolve, TILE_SETTLE_MS));
                const image = await page.screenshot({ type: "png", captureBeyondViewport: false });
                shot.push({ top, bytes: image instanceof Uint8Array ? image : new Uint8Array() });
                if (top + viewportHeight >= plan.height) {
                    break;
                }
            }
        } finally {
            await withTimeoutOrDefault(
                "restore the page after tiling",
                DEFAULT_TIMEOUTS.evaluateMs,
                undefined,
                () => page.evaluate(restoreShiftScript()).then(() => undefined)
            );
        }

        const image = await stitchTiles(
            placeTiles(shot, viewportHeight, plan.height),
            width,
            plan.height
        );
        return {
            image,
            height: plan.height,
            tiles: shot.length,
            ...(plan.truncatedAt !== undefined ? { truncatedAt: plan.truncatedAt } : {})
        };
    }

    private async scrollForCrop(
        page: Page,
        crop: ScreenshotCrop,
        viewportHeight: number
    ): Promise<void> {
        const offsets: Record<ScreenshotCrop, string> = {
            "above-fold": "0",
            "mid-page": `${viewportHeight * MID_PAGE_SCROLL_FACTOR}`,
            footer: "document.body ? document.body.scrollHeight : 0",
            "full-page": "0"
        };

        await withTimeoutOrDefault("scroll the page", DEFAULT_TIMEOUTS.evaluateMs, undefined, () =>
            page.evaluate(`window.scrollTo(0, ${offsets[crop]})`)
        );

        // Lazy-loaded imagery below the fold needs a moment, or the crop is a page of placeholders.
        await new Promise(resolve => setTimeout(resolve, 400));
    }

    private async documentHeight(page: Page): Promise<number> {
        return withTimeoutOrDefault(
            "measure the page height",
            DEFAULT_TIMEOUTS.evaluateMs,
            0,
            () => {
                return page.evaluate(
                    "document.body ? document.body.scrollHeight : 0"
                ) as Promise<number>;
            }
        );
    }

    async close(): Promise<void> {
        // Bounded, because a browser that will not close would otherwise hold the invocation open for
        // the task's full remaining budget.
        await withTimeoutOrDefault("close the browser", DEFAULT_TIMEOUTS.closeMs, undefined, () =>
            this.browser.close()
        );
    }
}

/**
 * Overrides come from the environment, not from the container.
 *
 * This is the one place in the package that is configured that way, and deliberately: the values it
 * needs — where the layer put the binary, which flags this runtime wants — are properties of the
 * deployment, and in Lambda deployment configuration arrives as environment variables. Threading a
 * config abstraction through the container to carry them would add API surface that nothing yet asks
 * for. `createChromiumBrowserProvider` is there for the programmatic case.
 */
class ChromiumBrowserProviderImpl implements BrowserProviderAbstraction.Interface {
    readonly name = "Chromium (Lambda layer)";

    private config: ChromiumConfig | undefined;

    constructor(config?: ChromiumConfig) {
        this.config = config;
    }

    async open(): Promise<IBrowserSession> {
        const resolved = await findExecutable(this.config);
        const args = mergeLaunchArgs(chromium.args, this.config);
        const userAgent = resolveUserAgent(this.config);

        const browser = await withTimeout("launch Chromium", DEFAULT_TIMEOUTS.launchMs, () =>
            puppeteer.launch({
                executablePath: resolved.executablePath,
                // `chromium.args` carries the flags a Lambda's sandbox and /tmp-only filesystem
                // require. We do not restate them: a hand-maintained copy of that list going stale is
                // a failure that only shows up in production.
                args,
                headless: true,
                // Set per capture, so this only has to be a valid starting point.
                defaultViewport: { width: 1440, height: 900 }
            })
        );

        return new ChromiumSession(browser, userAgent, {
            provider: this.name,
            executablePath: resolved.executablePath,
            executableSource: resolved.source,
            triedPaths: resolved.tried,
            userAgent,
            launchArgCount: args.length
        });
    }
}

/**
 * Builds a provider with explicit configuration, for callers outside the container — a self-hosted
 * runtime pointing at its own Chromium, or a test that needs a real browser.
 */
export const createChromiumBrowserProvider = (
    config?: ChromiumConfig
): BrowserProviderAbstraction.Interface => {
    return new ChromiumBrowserProviderImpl(config);
};

/**
 * The container-registered variant.
 *
 * A zero-argument constructor, because the container resolves constructor parameters as dependencies
 * and this class's only parameter is configuration rather than a collaborator.
 */
class EnvChromiumBrowserProvider extends ChromiumBrowserProviderImpl {
    constructor() {
        super();
    }
}

export const ChromiumBrowserProvider = createImplementation({
    abstraction: BrowserProviderAbstraction,
    implementation: EnvChromiumBrowserProvider,
    dependencies: []
});
