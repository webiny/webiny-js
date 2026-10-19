import { compileSource } from "~/api/bundler/compileSource.js";
import { toCompileSourceError } from "~/api/bundler/compileSource.js";
import { FIELD_RENDERER_GLOBAL_NAME } from "~/shared/adminExtensions/fieldRendererRuntime.js";
import { wrapFieldRendererSource } from "./wrapFieldRendererSource.js";
import { WRAPPER_LINES_BEFORE_SOURCE } from "./wrapFieldRendererSource.js";

export type CompiledFieldRenderer = { compiled: string; problem?: never } | { problem: string };

// Everything a renderer uses is handed in, so a module statement can only fail at runtime.
const MODULE_STATEMENT = /^\s*(import\s|import\(|export\s)|\brequire\s*\(/m;
const DECLARES_RENDERER = /\b(const|let|var|function)\s+Renderer\b/;

function checkSource(source: string): string | null {
    if (MODULE_STATEMENT.test(source)) {
        return "Remove import, export and require: everything a renderer uses is already in scope.";
    }
    if (!DECLARES_RENDERER.test(source)) {
        return "Declare the component as `const Renderer = createFieldRenderer(({ field }) => ...)`.";
    }
    return null;
}

/**
 * Checks and compiles renderer source, or says what is wrong with it in words the assistant can act
 * on, with the line in the source it wrote. Used twice: by the tool's input schema, so a renderer
 * that does not compile never reaches an approval prompt, and when it is saved.
 */
export async function compileFieldRendererSource(source: string): Promise<CompiledFieldRenderer> {
    const problem = checkSource(source);
    if (problem) {
        return { problem };
    }

    try {
        const compiled = await compileSource({
            contents: wrapFieldRendererSource(source),
            loader: "tsx",
            globalName: FIELD_RENDERER_GLOBAL_NAME
        });
        return { compiled };
    } catch (error) {
        const compileError = toCompileSourceError(error);
        if (!compileError) {
            throw error;
        }
        if (compileError.line === null) {
            return { problem: `Does not compile: ${compileError.message}` };
        }
        const line = compileError.line - WRAPPER_LINES_BEFORE_SOURCE;
        const lastLine = source.split("\n").length;
        // Something left open, such as a tag, is only noticed in the wrapper after the source.
        if (line > lastLine) {
            return {
                problem: `Does not compile, line ${lastLine} (something is left open by the end): ${compileError.message}`
            };
        }
        return { problem: `Does not compile, line ${line}: ${compileError.message}` };
    }
}
