import { createAbstraction, createImplementation, Result } from "@webiny/feature/api";
import type { BrowserProvider } from "@webiny/site-capture";
import { BlobStore } from "~/domain/stage.js";
import type { ImageCheck, SectionGeometry } from "~/domain/artifacts.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";
import { imageUrlTail, renderedImageCount } from "./renderedImages.js";

// The screenshot is taken at the desktop capture width so the rendered image lines up with the source
// section crop it is compared against. Height is a starting viewport only — the shot is full-page.
const DESKTOP_WIDTH = 1440;
const DESKTOP_HEIGHT = 900;
// One component's whole render: navigate the sandbox host, push the bundle, wait for mount, screenshot.
const RENDER_TIMEOUT_MS = 45_000;
// After the sandbox has processed our messages, a settle for the component's fonts/images to paint.
const RENDER_SETTLE_MS = 800;

// The sandbox (`@webiny/sdk-nextjs` ComponentSandbox) listens on raw `window` message events for these
// three message types — the same ones the Website Builder editor pushes over its Messenger. We post them
// directly into the page: the bundle to mount, the pinned theme's token CSS, and a fixed light mode so
// the shot is deterministic against the (light) source capture.
const SANDBOX_PATH =
    "/sandbox/component?wb.editing=true&wb.type=page&wb.id=sandbox&wb.path=/sandbox/component";
/**
 * The sandbox has handled our messages AND has something on screen.
 *
 * The attribute alone is set by the theme-mode message, which the sandbox handles whether or not the
 * bundle mounts — and `processBundle` returns silently when hydration fails. So a component that could
 * not hydrate satisfied this, screenshotted a blank page, and was recorded as a successful render: the
 * worst of the three outcomes, because it is the only one that looks like evidence.
 *
 * The second clause is deliberately about ANY rendered element rather than the component's own markup,
 * which cannot be predicted — styles and scripts are excluded because the sandbox emits those even
 * with nothing mounted.
 */
const RENDER_READY = `(function () {
    if (document.documentElement.getAttribute('data-wby-theme-mode') !== 'light') {
        return false;
    }
    if (!document.body) {
        return false;
    }
    var ignored = ['STYLE', 'SCRIPT', 'TEMPLATE', 'NEXT-ROUTE-ANNOUNCER'];
    return Array.prototype.some.call(document.body.querySelectorAll('*'), function (el) {
        return ignored.indexOf(el.tagName) === -1;
    });
})()`;

// How long the inject keeps re-announcing itself, and how often. Comfortably longer than hydration on
// a cold Next.js route, and well inside the render timeout so a real failure still reports as one.
const INJECT_RETRY_MS = 250;
const INJECT_RETRY_LIMIT = 80;

/**
 * Pushes the bundle and theme into the sandbox, and keeps pushing until it answers.
 *
 * `postMessage` has no delivery guarantee to a listener that does not exist yet: it goes to whoever is
 * listening at that moment and is otherwise dropped. The browser injects this straight after
 * `domcontentloaded`, which on a Next.js route is before hydration — so the sandbox's message listener
 * attaches a beat later and the first announcement lands on nothing. Every component then failed with
 * `Waiting failed: 30000ms exceeded`, which reads like the component being at fault rather than the
 * handshake never completing.
 *
 * Retrying rather than waiting for a hydration signal, because there is no such signal here that does
 * not belong to the host app. The loop stops as soon as the sandbox sets the attribute the render is
 * already waiting on, so a first announcement that lands costs one extra attribute read. Re-announcing
 * is safe: the three messages are a complete description of what to show, not a diff.
 */
const buildInject = (
    bundle: { name: string; bundledJs: string; bundledCss: string },
    themeCss: string
): string =>
    `(() => {
        var bundle = ${JSON.stringify(bundle)};
        var themeCss = ${JSON.stringify(themeCss)};
        var announce = function () {
            window.postMessage({ type: "wb.editor.sandbox.theme.css", payload: { css: themeCss } }, "*");
            window.postMessage({ type: "wb.editor.sandbox.theme.mode", payload: { mode: "light" } }, "*");
            window.postMessage({ type: "wb.editor.sandbox.component.bundle", payload: bundle }, "*");
        };
        announce();
        var attempts = 0;
        var timer = setInterval(function () {
            if (${RENDER_READY} || ++attempts > ${INJECT_RETRY_LIMIT}) {
                clearInterval(timer);
                return;
            }
            announce();
        }, ${INJECT_RETRY_MS});
    })()`;

/**
 * What the rendered component measures, read from the painted page.
 *
 * Symmetric with what a captured section can give, because the comparison is only worth making if
 * both sides are measured the same way. Every quantity is absolute within the 1440px canvas, which
 * both sides share, so neither needs a notion of "the component's own box" — a section's box and a
 * sandbox body are not the same kind of thing and trying to equate them is where this gets subtle.
 *
 * Text-bearing elements only: an element with a direct non-empty text child and a non-zero rect.
 * Wrappers have no size of their own worth comparing, and counting them would move the inset to
 * wherever the outermost div happens to start, which is usually 0 on both sides and says nothing.
 */
const MEASURE_GEOMETRY = `(function () {
    var IGNORED = { STYLE: 1, SCRIPT: 1, TEMPLATE: 1, "NEXT-ROUTE-ANNOUNCER": 1, HEAD: 1 };
    var texts = [];
    var all = document.body ? document.body.querySelectorAll("*") : [];
    for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (IGNORED[el.tagName]) { continue; }
        var direct = "";
        for (var n = 0; n < el.childNodes.length; n++) {
            if (el.childNodes[n].nodeType === 3) { direct += el.childNodes[n].nodeValue; }
        }
        if (!direct.replace(/\\s+/g, " ").trim()) { continue; }
        var rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) { continue; }
        var cs = window.getComputedStyle(el);
        texts.push({
            left: rect.left + window.scrollX,
            right: rect.right + window.scrollX,
            fontSize: parseFloat(cs.fontSize) || 0,
            lineHeight: parseFloat(cs.lineHeight) || 0
        });
    }
    if (!texts.length) { return null; }
    var sizes = texts.map(function (t) { return t.fontSize; }).sort(function (a, b) { return a - b; });
    var lines = texts.map(function (t) { return t.lineHeight; }).filter(function (v) { return v > 0; }).sort(function (a, b) { return a - b; });
    var left = Math.min.apply(null, texts.map(function (t) { return t.left; }));
    var right = Math.max.apply(null, texts.map(function (t) { return t.right; }));
    return {
        contentLeft: Math.round(left),
        contentRight: Math.round(right),
        maxFontSize: sizes[sizes.length - 1],
        medianFontSize: sizes[Math.floor(sizes.length / 2)],
        medianLineHeight: lines.length ? lines[Math.floor(lines.length / 2)] : null,
        textElements: texts.length
    };
})()`;

/**
 * Whether the painted component asked for an image it could not get, and whether it stringified an
 * object into a URL.
 *
 * Two readings of the same defect, because each sees what the other cannot. The driver's failed
 * requests catch any image that did not arrive, including a CSS background; this catches the cause
 * directly — "[object Object]" in a URL is unambiguous and needs no network at all. A component can
 * also stringify an object into a src that the browser never requests, which only this sees.
 *
 * The string is the whole test. A `createFileInput` value is `{ url }`, and reading it bare puts
 * exactly that text where a URL belongs. Measured across five sites, 8 of the 35 components that
 * declare a file input do it — with all four validators green, because a broken image is invisible
 * to bundling, text preservation, contract conformance and token binding alike.
 */
const AUDIT_IMAGES = `(function () {
    /*
     * Both spellings. An \`<img src>\` keeps the attribute verbatim, but a CSS \`url()\` is resolved
     * against the document and comes back from getComputedStyle percent-encoded, so the literal
     * string is "[object%20Object]" there. Matching only the readable form found the <img> case and
     * missed the background-image case in the same run — which is the half that produced a flat navy
     * hero.
     */
    var MARKERS = ["[object Object]", "[object%20Object]"];
    var marked = function (value) {
        for (var k = 0; k < MARKERS.length; k++) { if (value.indexOf(MARKERS[k]) >= 0) { return true; } }
        return false;
    };
    var stringified = [];
    var broken = [];
    var images = document.body ? document.body.querySelectorAll("img") : [];
    for (var i = 0; i < images.length; i++) {
        var src = images[i].getAttribute("src") || "";
        if (marked(src)) { stringified.push("img src: " + src.slice(0, 200)); }
        else if (src && images[i].complete && images[i].naturalWidth === 0) { broken.push(src.slice(0, 200)); }
    }
    var all = document.body ? document.body.querySelectorAll("*") : [];
    for (var j = 0; j < all.length && stringified.length < 10; j++) {
        var background = "";
        try { background = window.getComputedStyle(all[j]).backgroundImage || ""; } catch (e) {}
        if (marked(background)) {
            stringified.push("background-image: " + background.slice(0, 200));
        }
    }
    var used = [];
    for (var k = 0; k < images.length; k++) {
        var resolved = images[k].currentSrc || images[k].src || "";
        if (resolved) { used.push(resolved); }
    }
    for (var m = 0; m < all.length; m++) {
        var bg = "";
        try { bg = window.getComputedStyle(all[m]).backgroundImage || ""; } catch (e) {}
        var match = /url\\(["']?([^"')]+)/.exec(bg);
        if (match && match[1]) { used.push(match[1]); }
    }
    return { stringified: stringified.slice(0, 10), broken: broken.slice(0, 10), used: used.slice(0, 200) };
})()`;

/**
 * The image URLs a component ships as defaults, read from its own source.
 *
 * The third reading, and the only one that sees the case that started this. `background-image:
 * url([object Object])` is a CSS parse ERROR — an unquoted url token containing a space — so Chrome
 * drops the declaration, computes `none`, and requests nothing. Verified in a browser: both the
 * attribute and the CSSOM form compute to "none". There is therefore no marker in the DOM and no
 * failed request; the element simply has no background, which is indistinguishable from a component
 * that was never given one.
 *
 * So neither of the other two readings can catch it. What can: the component declares these URLs as
 * defaults and the render then uses none of them.
 */
const declaredImageUrls = (source: string): string[] => {
    /*
     * Scoped to the fields declared `createFileInput`, because a Link's default is also `{ url }`.
     * Matching every `url: "https://…"` in the source flagged three components whose only unused
     * URLs were navigation destinations — Contact Bar's "contact-us", the footer's Google Maps link —
     * which is the measure describing the file rather than the defect.
     */
    const fields = new Set<string>();
    for (const match of source.matchAll(
        /name:\s*"([A-Za-z0-9_]+)"\s*,\s*factory:\s*"createFileInput"/g
    )) {
        fields.add(match[1]);
    }
    if (fields.size === 0) {
        return [];
    }
    const urls = new Set<string>();
    for (const field of fields) {
        /* `field: { url: "…" }` — the object form a file input's value takes. */
        const nested = new RegExp(`\\b${field}\\s*:\\s*\\{[^{}]*url:\\s*"(https?://[^"]+)"`, "g");
        for (const match of source.matchAll(nested)) {
            urls.add(match[1]);
        }
        /* `field: [ { url: "…" }, … ]` — a list file input, whose items are the file objects. */
        const listed = new RegExp(`\\b${field}\\s*:\\s*\\[([\\s\\S]{0,4000}?)\\]`, "g");
        for (const match of source.matchAll(listed)) {
            for (const inner of match[1].matchAll(/url:\s*"(https?:\/\/[^"]+)"/g)) {
                urls.add(inner[1]);
            }
        }
    }
    return [...urls];
};

const slug = (signature: string): string => signature.replace(/[^a-zA-Z0-9_-]/g, "-");

/**
 * The source section crop's own dimensions, for the Generate view to show beside the render's.
 *
 * This replaced a visual-similarity indicator: a 64x64 greyscale mean-absolute-difference that was
 * measured, across 34 components on four sites, to track average brightness and nothing else. It
 * scored 0.97 for a component rendered 8.1x taller than its section, 0.97 for a footer that had lost
 * every image, and 0.80 for the most faithful component in the set — and it was drawn next to the
 * three real assertions, in green above 0.85, so it certified exactly the failures a reviewer most
 * needed to see. Two measured heights say less and mislead nobody.
 */
const cropDimensions = async (
    bytes: Uint8Array
): Promise<{ width: number; height: number } | null> => {
    try {
        const sharp = (await import("sharp")).default;
        const meta = await sharp(bytes).metadata();
        return meta.width && meta.height ? { width: meta.width, height: meta.height } : null;
    } catch {
        return null;
    }
};

export interface RenderComponentInput {
    session: BrowserProvider.Session;
    runId: string;
    stageVersion: number;
    /** The deployed website origin hosting `/sandbox/component`. */
    previewDomain: string;
    /** The pinned theme's `--wby-*` token CSS, or "" to fall back to the site's active theme. */
    themeCss: string;
    component: { signature: string; name: string; source: string; css: string };
    /** Blob key of the source section crop, whose dimensions are recorded beside the render. Optional. */
    sourceCropRef?: string;
}

export interface RenderedComponent {
    renderRef: string;
    width: number;
    height: number;
    /** The source section crop's size, so the view can state both and let the reader compare. */
    sourceWidth: number | null;
    sourceHeight: number | null;
    /**
     * What the page reported while rendering, even though the render completed.
     *
     * Carried on success, not only on failure, because the failure that matters here does not fail:
     * the sandbox swallows a hydration error, renders nothing, and the screenshot is a blank page that
     * every check calls a success. The page said why on the way past, and this is the only thing
     * listening.
     */
    pageErrors: string[];
    /** The sandbox's markup, present only when the render produced a zero-height document. */
    bodyPreview?: string;
    /** What the painted component measured — see `MEASURE_GEOMETRY`. Null when it drew no text. */
    geometry?: SectionGeometry | null;
    /** What the render observed about the component's images — see `AUDIT_IMAGES`. A report, not a gate. */
    imageCheck?: ImageCheck;
}

/**
 * Screenshots one generated component as it renders standalone. It bundles the component server-side
 * (the same esbuild path the editor uses), then drives the shared browser to the website's sandbox
 * route, pushes the bundle + pinned-theme CSS in, waits for it to mount and screenshots it — so the
 * Generate view can show the generated component beside the source section it was built from.
 *
 * The bundler is imported lazily: it pulls in `esbuild-wasm`, which must not be initialised on the
 * GraphQL Lambda that imports this feature only to build the schema (same reason `sharp` is lazy).
 */
export interface IComponentRenderService {
    render(input: RenderComponentInput): Promise<Result<RenderedComponent, ExtractionError>>;
}

export const ComponentRenderService = createAbstraction<IComponentRenderService>(
    "ComponentExtraction/ComponentRenderService"
);
export namespace ComponentRenderService {
    export type Interface = IComponentRenderService;
}

class ComponentRenderServiceImpl implements IComponentRenderService {
    constructor(private blobStore: BlobStore.Interface) {}

    async render(input: RenderComponentInput): Promise<Result<RenderedComponent, ExtractionError>> {
        const { component } = input;

        let bundled;
        try {
            const { bundleComponent } =
                await import("@webiny/remote-components/api/bundler/index.js");
            bundled = await bundleComponent({
                name: component.name,
                source: component.source,
                css: component.css || undefined
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(
                new ExtractionValidationError(`could not bundle "${component.name}": ${message}`)
            );
        }

        const url = `${input.previewDomain}${SANDBOX_PATH}`;
        const inject = buildInject(
            { name: bundled.name, bundledJs: bundled.bundled, bundledCss: bundled.css ?? "" },
            input.themeCss
        );

        let rendered;
        try {
            rendered = await input.session.render({
                url,
                viewportWidth: DESKTOP_WIDTH,
                viewportHeight: DESKTOP_HEIGHT,
                timeoutMs: RENDER_TIMEOUT_MS,
                inject,
                waitFor: RENDER_READY,
                settleMs: RENDER_SETTLE_MS,
                measure: `(function () { return { geometry: ${MEASURE_GEOMETRY}, images: ${AUDIT_IMAGES} }; })()`
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            /*
             * A wait timeout almost never means the component is at fault, and read as if it did it
             * has cost hours twice: the sandbox is served by a local dev app behind an ephemeral
             * tunnel, and when either is down every component fails here, identically. So the error
             * names the host it could not get an answer from.
             */
            const unreachable = /Waiting failed|timeout|net::ERR/i.test(message)
                ? ` — the sandbox at ${input.previewDomain} never signalled that it mounted, which usually means that host is unreachable rather than that the component is broken; check it before reading anything into this`
                : "";
            return Result.fail(
                new ExtractionValidationError(
                    `could not render "${component.name}": ${message}${unreachable}`
                )
            );
        }

        const key = `${input.runId}/render/v${input.stageVersion}/${slug(component.signature)}.png`;
        const stored = await this.blobStore.put(key, rendered.image, "image/png");
        if (stored.isFail()) {
            return Result.fail(stored.error);
        }

        // Best-effort: a missing crop just leaves the source size unstated.
        let source: { width: number; height: number } | null = null;
        if (input.sourceCropRef) {
            const crop = await this.blobStore.get(input.sourceCropRef);
            if (crop.isOk()) {
                source = await cropDimensions(crop.value);
            }
        }

        /*
         * One in-page pass returns both: the geometry the proportion work added, and the image audit.
         * Split here so `geometry` keeps the shape every existing reader expects.
         */
        const measured = rendered.measurement as {
            geometry: SectionGeometry | null;
            images: { stringified: string[]; broken: string[]; used: string[] };
        } | null;

        /*
         * A default the component ships and the page never used. Compared on the path and filename
         * rather than the whole URL, since a CDN may serve a different query string than the one in
         * the source.
         */
        const used = new Set((measured?.images?.used ?? []).map(imageUrlTail));
        const declaredButUnused = declaredImageUrls(component.source).filter(
            url => !used.has(imageUrlTail(url))
        );
        const failedRequests = [
            ...(rendered.failedImageRequests ?? []),
            ...(measured?.images?.broken ?? [])
        ];

        return Result.ok({
            pageErrors: rendered.pageErrors ?? [],
            bodyPreview: rendered.bodyPreview,
            geometry: measured?.geometry ?? null,
            imageCheck: {
                stringifiedValues: measured?.images?.stringified ?? [],
                failedRequests: failedRequests.slice(0, 10),
                declaredButUnused: declaredButUnused.slice(0, 10),
                renderedImageCount: renderedImageCount(measured?.images?.used ?? [], failedRequests)
            },
            renderRef: stored.value,
            width: rendered.width,
            height: rendered.height,
            sourceWidth: source?.width ?? null,
            sourceHeight: source?.height ?? null
        });
    }
}

export const ComponentRenderServiceImplementation = createImplementation({
    abstraction: ComponentRenderService,
    implementation: ComponentRenderServiceImpl,
    dependencies: [BlobStore]
});
