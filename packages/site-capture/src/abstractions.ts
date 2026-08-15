import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CaptureStorageError } from "./errors.js";

/**
 * Headless-browser capture, behind a seam.
 *
 * Nothing above this interface knows whether the page was read by Chromium in a Lambda, by a hosted
 * rendering service, or by a fixture in a test. The visit sequence — viewport, media interception,
 * navigation, settle, bot-wall check, consent dismissal, screenshots — lives in the provider; what a
 * given consumer wants *out of* the page is supplied as a pluggable in-page evaluator, so a token
 * sampler and a DOM/segment sampler share one browser lifecycle without either owning it.
 */

export interface FontResource {
    url: string;
    family?: string;
    weight?: string;
    style?: string;
}

export interface Screenshot {
    /** Where the bytes were written. Screenshots go to storage, never into a task payload. */
    key: string;
    label: string;
    width: number;
    height: number;
}

/**
 * Which part of the page to capture. `"above-fold" | "mid-page" | "footer"` are viewport-sized scroll
 * crops; `"full-page"` is a true full-page image — `page.screenshot({ fullPage: true })`, unbounded by
 * document height. Theme extraction wants the scroll crops (a tall image scaled down to a model's
 * longest-edge limit loses the type and spacing detail it was sent to judge); component extraction
 * wants one `"full-page"` image per page and derives its segment crops from it offline.
 */
export type ScreenshotCrop = "above-fold" | "mid-page" | "footer" | "full-page";

export interface ScreenshotRequest {
    label: string;
    crop: ScreenshotCrop;
}

export interface ScreenshotCapture {
    requests: ScreenshotRequest[];
    /**
     * Persists the bytes and returns the storage key.
     *
     * Injected rather than resolved here so the browser layer never depends on storage — and so a
     * test can capture screenshots without writing anything.
     */
    write(image: Uint8Array, label: string): Promise<string>;
}

export interface CapturePageParams {
    url: string;
    viewportWidth: number;
    viewportHeight: number;
    /** Set for a dark-mode probe. */
    emulateDarkMode?: boolean;
    /** Hard ceiling for this page. Every network operation must be able to time out. */
    timeoutMs: number;
    /**
     * Puppeteer resource types to abort during load (e.g. "media", "websocket", "eventsource"). Defaults
     * to just "media". A caller crawling resource-heavy pages can add non-visual connection-heavy types to
     * keep the browser from exhausting its sockets/handles — none of these affect the screenshot or DOM.
     */
    blockResourceTypes?: string[];
    /**
     * The in-page script run after navigation, settle, the bot-wall check and consent dismissal, and
     * before screenshots. A string, exactly as `page.evaluate` accepts, so the provider hands it to any
     * driver without depending on that driver's function-serialisation rules. Its return value becomes
     * `CaptureResult.result`. This is the pluggable seam: theme extraction passes its token sampler,
     * component extraction a DOM/segment sampler, over the same visit sequence.
     */
    evaluate: string;
    /**
     * Screenshots are taken only when this is supplied.
     *
     * One signal rather than a boolean alongside a writer: a flag that says "capture" with nowhere to
     * put the bytes has no correct behaviour.
     */
    screenshots?: ScreenshotCapture;
}

/**
 * Render a page whose content is pushed in after load, then screenshot it — as opposed to `capture`,
 * which reads a public URL as-is. Used to screenshot a standalone-mounted component: navigate to a
 * render host, inject the bundle/theme via an in-page script, wait until it has mounted, and shoot.
 * None of `capture`'s crawl machinery (media abort, consent dismissal, bot-wall check) applies here —
 * the page is our own.
 */
export interface RenderPageParams {
    url: string;
    viewportWidth: number;
    viewportHeight: number;
    /** Hard ceiling for the whole render, including the wait for content to mount. */
    timeoutMs: number;
    /**
     * In-page script run once after navigation to push content in (e.g. `window.postMessage` a bundle).
     * A string, exactly as `page.evaluate` accepts — the provider never depends on function serialisation.
     */
    inject: string;
    /**
     * In-page boolean expression polled until it returns true — the signal that the injected content has
     * mounted and is safe to screenshot (e.g. a rendered root element being present and non-empty). A
     * string, evaluated repeatedly; a timeout is treated as "render did not appear".
     */
    waitFor: string;
    /** Extra settle after `waitFor` succeeds, for fonts/images to paint. Defaults to a small value. */
    settleMs?: number;
}

export interface RenderResult {
    /** The URL actually landed on, after redirects. */
    finalUrl: string;
    /** The PNG bytes. Handed back to the caller to store; the browser layer never touches storage. */
    image: Uint8Array;
    width: number;
    height: number;
}

export interface CaptureResult<TResult> {
    url: string;
    /** The URL actually landed on, after redirects. */
    finalUrl: string;
    status: number;
    title: string;
    /** Whatever the in-page `evaluate` script returned; the caller asserts its shape via `TResult`. */
    result: TResult;
    /** Font files the network log shows were really loaded, not merely declared in CSS. */
    fontResources: FontResource[];
    screenshots: Screenshot[];
    /** Labels of screenshots requested but not captured — a degraded result, reported not swallowed. */
    failedScreenshots: string[];
    /** Overlays hidden before the evaluator ran, described well enough to identify. */
    dismissedOverlays: string[];
}

export interface IBrowserSession {
    capture<TResult>(params: CapturePageParams): Promise<CaptureResult<TResult>>;
    /**
     * Render a page whose content is injected after load, then screenshot it. See {@link RenderPageParams}.
     * Separate from `capture` because the visit sequence is different: no media interception, consent
     * dismissal or bot-wall check — the page is ours — and a screenshot is taken only once the injected
     * content has mounted.
     */
    render(params: RenderPageParams): Promise<RenderResult>;
    close(): Promise<void>;
    /**
     * What the driver resolved at launch — for Chromium, which executable it found and where. Surfaced
     * so it can be written to a log; the layer's internal layout is the least-verified thing here.
     */
    readonly diagnostics: Record<string, unknown>;
}

export interface IBrowserProvider {
    /**
     * Opens a session. Callers must `close()` it — a leaked browser in a Lambda is a leaked
     * invocation, and the container may be reused.
     */
    open(): Promise<IBrowserSession>;
    /** Human-readable, for progress reporting and for saying which backend failed. */
    readonly name: string;
}

export const BrowserProvider = createAbstraction<IBrowserProvider>("SiteCapture/BrowserProvider");

export namespace BrowserProvider {
    export type Interface = IBrowserProvider;
    export type Session = IBrowserSession;
}

/**
 * Where captured screenshots are stored.
 *
 * Deliberately smaller than the platform's file manager: capture needs to put an image somewhere under
 * its own prefix and delete the lot when it is done, not manage a media library.
 *
 * This package exports the interface and a prefix-bound implementation (`createS3ScreenshotStore`) but
 * NOT a DI abstraction token — that is a per-consumer concern. Two features registering their own
 * prefix against one shared token in the same container would collide, and the last registered would
 * silently win. So each consumer declares its own
 * `createAbstraction<IScreenshotStore>("<Feature>/ScreenshotStore")` and registers the prefix-bound
 * instance against it.
 */
export interface StoredScreenshot {
    key: string;
    label: string;
}

export interface IScreenshotStore {
    /**
     * Persists one screenshot and returns its storage key. `captureId` scopes the object under the
     * store's prefix, so a whole capture's images can be cleaned up together.
     */
    put(
        captureId: string,
        label: string,
        image: Uint8Array
    ): Promise<Result<StoredScreenshot, CaptureStorageError>>;

    /** Read back later — often in a different invocation than the one that wrote it. */
    get(key: string): Promise<Result<Uint8Array, CaptureStorageError>>;

    /** Remove every object written under this capture's prefix. */
    deleteAll(captureId: string): Promise<Result<void, CaptureStorageError>>;
}
