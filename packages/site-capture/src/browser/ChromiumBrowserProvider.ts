import { existsSync } from "node:fs";
import chromium from "@sparticuz/chromium-min";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { createImplementation } from "@webiny/feature/api";
import {
    BrowserProvider as BrowserProviderAbstraction,
    type CapturePageParams,
    type CaptureResult,
    type FontResource,
    type IBrowserSession,
    type Screenshot,
    type ScreenshotCrop
} from "~/abstractions.js";
import { dismissBannersScript, type BannerDismissalResult } from "./dismissBanners.js";
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

/** Fraction of the viewport to scroll for the mid-page crop. */
const MID_PAGE_SCROLL_FACTOR = 1.5;

const CROP_LABELS: Record<ScreenshotCrop, string> = {
    "above-fold": "top of the page",
    "mid-page": "middle of the page",
    footer: "bottom of the page",
    "full-page": "the full page"
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

    private async capturePage<TResult>(
        page: Page,
        params: CapturePageParams
    ): Promise<CaptureResult<TResult>> {
        const fonts = new Map<string, FontResource>();

        await page.setUserAgent(this.userAgent);
        await page.setViewport({
            width: params.viewportWidth,
            height: params.viewportHeight,
            deviceScaleFactor: 1
        });

        if (params.emulateDarkMode) {
            await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
        }

        // Fonts are recorded from the network, not from CSS: an @font-face block proves a declaration,
        // whereas a response proves the browser actually chose and fetched that file.
        page.on("response", response => {
            try {
                if (response.request().resourceType() === "font") {
                    const url = response.url();
                    if (!fonts.has(url)) {
                        fonts.set(url, { url });
                    }
                }
            } catch {
                // A response event that outlives its request must not take the page down.
            }
        });

        // Media is the one resource class that costs real time and tells us nothing: a hero video
        // contributes no colours, no type and no spacing.
        await page.setRequestInterception(true);
        page.on("request", request => {
            const type = request.resourceType();
            if (type === "media") {
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

        // Before sampling, so the sampler's own `display: none` filter excludes whatever was hidden.
        const dismissal = await withTimeoutOrDefault<BannerDismissalResult>(
            "dismiss consent banners",
            DEFAULT_TIMEOUTS.bannerMs,
            { hidden: [], unlockedScroll: false },
            () => page.evaluate(dismissBannersScript()) as Promise<BannerDismissalResult>
        );

        // The pluggable seam. The visit sequence above is fixed; what to read off the settled page is
        // the caller's — a token sampler, a DOM/segment sampler — supplied as an in-page script whose
        // return value we hand back untouched as `result`.
        const result = await withTimeout(
            `evaluate ${params.url}`,
            DEFAULT_TIMEOUTS.evaluateMs,
            () => page.evaluate(params.evaluate) as Promise<TResult>
        );

        const screenshots = await this.captureScreenshots(page, params);

        return {
            url: params.url,
            finalUrl: page.url(),
            status,
            title,
            result,
            fontResources: [...fonts.values()],
            screenshots: screenshots.taken,
            failedScreenshots: screenshots.failed,
            // Returned rather than logged here: the caller has its own logger, and this belongs in the
            // consumer's own log where someone debugging a missing element will look for it.
            dismissedOverlays: dismissal.hidden
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
            const screenshot = await withTimeoutOrDefault<Screenshot | undefined>(
                `capture "${request.label}" (${CROP_LABELS[request.crop]})`,
                DEFAULT_TIMEOUTS.screenshotMs,
                undefined,
                async () => {
                    await this.scrollForCrop(page, request.crop, params.viewportHeight);

                    const image = await page.screenshot({
                        type: "png",
                        fullPage: request.crop === "full-page"
                    });

                    const bytes = image instanceof Uint8Array ? image : new Uint8Array();
                    const key = await capture.write(bytes, request.label);

                    return {
                        key,
                        label: request.label,
                        width: params.viewportWidth,
                        height:
                            request.crop === "full-page"
                                ? await this.documentHeight(page)
                                : params.viewportHeight
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
