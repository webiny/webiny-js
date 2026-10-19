import { Result } from "@webiny/feature/api";
import { AdminExtensionSourcePreparer } from "~/api/adminExtensions/features/AdminExtensionSourcePreparer/abstractions.js";
import { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";
import { compileSource } from "~/api/bundler/compileSource.js";
import { toCompileSourceError } from "~/api/bundler/compileSource.js";
import { FieldRendererConfigSchema } from "~/shared/adminExtensions/fieldRendererConfig.js";
import { FIELD_RENDERER_GLOBAL_NAME } from "~/shared/adminExtensions/fieldRendererRuntime.js";
import { parseJson } from "~/shared/adminExtensions/parseJson.js";
import { wrapFieldRendererSource } from "./wrapFieldRendererSource.js";
import { WRAPPER_LINES_BEFORE_SOURCE } from "./wrapFieldRendererSource.js";

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

async function compile(source: string): Promise<Result<string, AdminExtensionValidationError>> {
    try {
        const compiled = await compileSource({
            contents: wrapFieldRendererSource(source),
            loader: "tsx",
            globalName: FIELD_RENDERER_GLOBAL_NAME
        });
        return Result.ok(compiled);
    } catch (error) {
        const compileError = toCompileSourceError(error);
        if (!compileError) {
            throw error;
        }
        let message = `Does not compile: ${compileError.message}`;
        if (compileError.line !== null) {
            const line = compileError.line - WRAPPER_LINES_BEFORE_SOURCE;
            message = `Does not compile, line ${line}: ${compileError.message}`;
        }
        return Result.fail(new AdminExtensionValidationError(message));
    }
}

class FieldRendererSourcePreparerImpl implements AdminExtensionSourcePreparer.Interface {
    readonly kind = "fieldRenderer" as const;

    async prepare(
        input: AdminExtensionSourcePreparer.Input
    ): Promise<Result<AdminExtensionSourcePreparer.Prepared, AdminExtensionValidationError>> {
        const config = FieldRendererConfigSchema.safeParse(parseJson(input.config));
        if (!config.success) {
            return Result.fail(new AdminExtensionValidationError(config.error));
        }

        const problem = checkSource(input.source);
        if (problem) {
            return Result.fail(new AdminExtensionValidationError(problem));
        }

        const compiled = await compile(input.source);
        if (compiled.isFail()) {
            return Result.fail(compiled.error);
        }

        return Result.ok({
            source: input.source,
            config: JSON.stringify(config.data),
            compiled: compiled.value
        });
    }
}

export const FieldRendererSourcePreparer = AdminExtensionSourcePreparer.createImplementation({
    implementation: FieldRendererSourcePreparerImpl,
    dependencies: []
});
