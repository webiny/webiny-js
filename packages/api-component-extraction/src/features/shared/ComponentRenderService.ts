import { createAbstraction, createImplementation, Result } from "@webiny/feature/api";
import type { BrowserProvider } from "@webiny/site-capture";
import { BlobStore } from "~/domain/stage.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

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
                settleMs: RENDER_SETTLE_MS
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(
                new ExtractionValidationError(`could not render "${component.name}": ${message}`)
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

        return Result.ok({
            pageErrors: rendered.pageErrors ?? [],
            bodyPreview: rendered.bodyPreview,
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
