import { FIELD_RENDERER_RUNTIME_NAMES } from "~/shared/adminExtensions/fieldRendererRuntime.js";

/** Lines the wrapper adds above the stored source, so compile errors can point at the user's line. */
export const WRAPPER_LINES_BEFORE_SOURCE = 2;

/**
 * Puts stored renderer source inside the runtime contract: a default-exported factory that receives
 * the runtime, brings every runtime name into scope, and returns the `Renderer` the source declares.
 */
export function wrapFieldRendererSource(source: string): string {
    const names = FIELD_RENDERER_RUNTIME_NAMES.join(", ");

    return [
        "export default function createRenderer(runtime) {",
        `const { ${names} } = runtime;`,
        source,
        "return Renderer;",
        "}"
    ].join("\n");
}
