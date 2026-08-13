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
// The mode message sets this attribute on <html>; its presence is our "the sandbox handled our messages
// and re-rendered" signal — independent of the component's own markup, which we can't predict.
const RENDER_READY = `document.documentElement.getAttribute('data-wby-theme-mode') === 'light'`;

const buildInject = (
    bundle: { name: string; bundledJs: string; bundledCss: string },
    themeCss: string
): string =>
    `(() => {
        var bundle = ${JSON.stringify(bundle)};
        var themeCss = ${JSON.stringify(themeCss)};
        window.postMessage({ type: "wb.editor.sandbox.theme.css", payload: { css: themeCss } }, "*");
        window.postMessage({ type: "wb.editor.sandbox.theme.mode", payload: { mode: "light" } }, "*");
        window.postMessage({ type: "wb.editor.sandbox.component.bundle", payload: bundle }, "*");
    })()`;

const slug = (signature: string): string => signature.replace(/[^a-zA-Z0-9_-]/g, "-");

export interface RenderComponentInput {
    session: BrowserProvider.Session;
    runId: string;
    stageVersion: number;
    /** The deployed website origin hosting `/sandbox/component`. */
    previewDomain: string;
    /** The pinned theme's `--wby-*` token CSS, or "" to fall back to the site's active theme. */
    themeCss: string;
    component: { signature: string; name: string; source: string; css: string };
}

export interface RenderedComponent {
    renderRef: string;
    width: number;
    height: number;
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

        return Result.ok({
            renderRef: stored.value,
            width: rendered.width,
            height: rendered.height
        });
    }
}

export const ComponentRenderServiceImplementation = createImplementation({
    abstraction: ComponentRenderService,
    implementation: ComponentRenderServiceImpl,
    dependencies: [BlobStore]
});
