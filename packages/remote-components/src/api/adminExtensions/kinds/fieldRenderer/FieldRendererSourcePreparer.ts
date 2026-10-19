import { Result } from "@webiny/feature/api";
import { AdminExtensionSourcePreparer } from "~/api/adminExtensions/features/AdminExtensionSourcePreparer/abstractions.js";
import { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";
import { FieldRendererConfigSchema } from "~/shared/adminExtensions/fieldRendererConfig.js";
import { parseJson } from "~/shared/adminExtensions/parseJson.js";
import { compileFieldRendererSource } from "./compileFieldRendererSource.js";

class FieldRendererSourcePreparerImpl implements AdminExtensionSourcePreparer.Interface {
    readonly kind = "fieldRenderer" as const;
    readonly runsCode = true;

    async prepare(
        input: AdminExtensionSourcePreparer.Input
    ): Promise<Result<AdminExtensionSourcePreparer.Prepared, AdminExtensionValidationError>> {
        const config = FieldRendererConfigSchema.safeParse(parseJson(input.config));
        if (!config.success) {
            return Result.fail(new AdminExtensionValidationError(config.error));
        }

        const result = await compileFieldRendererSource(input.source);
        if (result.problem !== undefined) {
            return Result.fail(new AdminExtensionValidationError(result.problem));
        }

        return Result.ok({
            source: input.source,
            config: JSON.stringify(config.data),
            compiled: result.compiled
        });
    }
}

export const FieldRendererSourcePreparer = AdminExtensionSourcePreparer.createImplementation({
    implementation: FieldRendererSourcePreparerImpl,
    dependencies: []
});
