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

/**
 * One image the page actually loaded, with the bytes the browser received.
 *
 * Taken from the network rather than re-requested, and that is not merely an optimisation. A CDN can
 * serve a different representation of the same URL depending on the request: Cloudinary's `f_auto`
 * returns WebP to Chrome and PNG to a plain server-side fetch, byte-for-byte different images under
 * one address. Whatever fetches these bytes later would store something the visitor never saw, with
 * nothing in the result to say so.
 *
 * `sha256` is over the DECODED bytes, which is what `response.buffer()` returns — verified against a
 * `content-encoding: br` response, where the decoded form is 10,751 bytes and the wire form 4,279.
 * Hashing the wire form would make the hash depend on a CDN's compression choice.
 */
export interface CapturedImage {
    url: string;
    contentType: string;
    /** sha256 of the decoded bytes. The identity used for deduplication. */
    sha256: string;
    bytes: Uint8Array;
    size: number;
    /**
     * Loaded by a subframe rather than the page itself — so it belongs to an embedded third-party
     * widget (a map, a reCAPTCHA, a video player) rather than to the page's own content.
     *
     * This is the "part of an embed" test, and it is deliberately not a hostname test: the images
     * worth migrating on these sites are all on a third-party CDN, so judging by host would leave
     * exactly the wrong set behind. Which frame requested it says whether the migration reproduces
     * the thing that renders it.
     */
    embedded: boolean;
}

/**
 * An image request the page made whose bytes were not collected, with the reason.
 *
 * The three reasons mean different things to a migration and must not be flattened. A response that
 * is not an image at all is a beacon, not content — nothing to migrate and nothing lost. A body over
 * the page ceiling or one that could not be read IS content, and its absence is a gap.
 */
export interface SkippedImage {
    url: string;
    reason: "page-byte-ceiling" | "unreadable" | "not-an-image";
    /** What went wrong, when the reason alone does not say it. */
    detail?: string;
    /** The HTTP status, which is what makes a 204 beacon recognisable as such. */
    status?: number;
}

export interface Screenshot {
    /** Where the bytes were written. Screenshots go to storage, never into a task payload. */
    key: string;
    label: string;
    width: number;
    height: number;
    /**
     * Full-page shots only: set when the page was taller than the stitching cap, to the height it
     * really had. The image stops at `height`; everything below it is not in the picture.
     */
    truncatedAt?: number;
    /** Full-page shots only: how many viewport tiles the image was stitched from. */
    tiles?: number;
}

/**
 * Which part of the page to capture. `"above-fold" | "mid-page" | "footer"` are viewport-sized scroll
 * crops; `"full-page"` is a full-page image stitched from viewport tiles at the capture viewport (see
 * `browser/stitch.ts`), bounded at a fixed height. Theme extraction wants the scroll crops (a tall image scaled down to a model's
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
     * Collect the bytes of every image the page loads. Absent means collect nothing, so a caller that
     * only wants a screenshot pays none of this cost.
     *
     * The ceiling is per page and exists so one image-heavy page cannot exhaust the Lambda's memory:
     * images stream from the network into memory and out to the caller, never through `/tmp`, so
     * memory is the only constraint that binds. An image that would cross the ceiling is reported in
     * `skippedImages` rather than dropped, because an image nobody can account for is the failure
     * this pipeline is trying to stop making.
     */
    collectImages?: {
        /** Stop collecting once this page's collected bytes reach this total. */
        maxTotalBytes: number;
        /** How many response bodies to read at once. Defaults to a small number. */
        maxConcurrent?: number;
    };
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
    /**
     * In-page script run after `waitFor` and the settle, just before the screenshot. Its return value
     * becomes `RenderResult.measurement`.
     *
     * The same seam `capture` has as `evaluate`, for the same reason: what a caller wants to know
     * about the page it rendered is the caller's business, and the browser layer should not grow a
     * field per question. A screenshot answers "does it look right" and nothing else — it cannot say
     * what size the type is or where the content starts, which is what comparing a generated
     * component against its source section needs.
     */
    measure?: string;
}

export interface RenderResult {
    /** The URL actually landed on, after redirects. */
    finalUrl: string;
    /** The PNG bytes. Handed back to the caller to store; the browser layer never touches storage. */
    image: Uint8Array;
    width: number;
    height: number;
    /**
     * Errors the page itself reported — `console.error` and uncaught exceptions — oldest first.
     *
     * Carried out because the render host reports its own failures this way and nothing was reading
     * them: a component whose bundle would not hydrate logged exactly why, in a console that was
     * discarded, and the render was recorded as a success with a blank screenshot. Capped, since a
     * page in a loop can produce thousands.
     */
    pageErrors: string[];
    /**
     * Image URLs the browser asked for and did not get — a failed request, or a 4xx/5xx response.
     *
     * The witness for a defect nothing else sees. A generated component can read a file input's
     * value bare — the value is `{ url }` — so the browser requests `url([object Object])` and the
     * background colour beneath shows through. The bundle builds, the text is preserved, the props
     * conform and the colours are variables, so every validator passes and the render is recorded
     * `ok` with a picture that is simply missing its photograph.
     *
     * From the driver rather than the page, because a CSS background image leaves no element to
     * interrogate: `naturalWidth` answers for `<img>` and says nothing about a `background-image`
     * that never arrived. Capped like `pageErrors`.
     */
    failedImageRequests: string[];
    /**
     * A truncated look at what was actually in `<body>`, captured only when the document had no
     * height.
     *
     * A render that completes with a zero-height document has produced a blank screenshot, and
     * nothing else in the result distinguishes that from a component that genuinely draws nothing.
     * The markup says which — empty wrappers, a mounted root with no children, an error boundary —
     * and it is the one question the existing signals cannot answer.
     */
    bodyPreview?: string;
    /** Whatever `measure` returned, or undefined when none was supplied or it threw. */
    measurement?: unknown;
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
    /** Image bytes the page loaded, when `collectImages` asked for them. */
    images: CapturedImage[];
    /** Images the page loaded that were not collected, each with its reason. */
    skippedImages: SkippedImage[];
    screenshots: Screenshot[];
    /** Labels of screenshots requested but not captured — a degraded result, reported not swallowed. */
    failedScreenshots: string[];
    /** The early overlay pass — before the evaluator, so it decides what the element tree contains. */
    earlyClearance: OverlayClearanceResult;
    /** The late overlay pass — immediately before the camera, so it decides what the screenshot shows. */
    lateClearance: OverlayClearanceResult;
}

/**
 * The result of clearing popups, consent banners and overlays off a page.
 *
 * Kept as four separate lists rather than one, because they answer different questions: what was
 * hidden is a property of the site, what was closed is a property of the overlay, and what had to be
 * removed is the part carrying risk — it is the only one where the capture acted against a page that
 * did not offer a way out, and the only one worth reading when a section comes back missing.
 */
export interface OverlayClearanceResult {
    /** Consent banners hidden by selector or keyword. */
    hidden: string[];
    /** Overlays closed through their own close control. */
    dismissed: string[];
    /** Overlays removed because they resisted closing, each carrying the reason. */
    removed: string[];
    /** Whether a scroll lock had to be lifted. */
    unlockedScroll: boolean;
    /** What still covered the viewport centre when the screenshots were taken, or `null`. */
    overlayRemains: string | null;
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
