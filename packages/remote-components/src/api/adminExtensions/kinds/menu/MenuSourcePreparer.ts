import { Result } from "@webiny/feature/api";
import { AdminExtensionSourcePreparer } from "~/api/adminExtensions/features/AdminExtensionSourcePreparer/abstractions.js";
import { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";
import { MenuSourceSchema } from "~/shared/adminExtensions/menuSource.js";
import { parseJson } from "~/shared/adminExtensions/parseJson.js";

class MenuSourcePreparerImpl implements AdminExtensionSourcePreparer.Interface {
    readonly kind = "menu" as const;

    async prepare(
        input: AdminExtensionSourcePreparer.Input
    ): Promise<Result<AdminExtensionSourcePreparer.Prepared, AdminExtensionValidationError>> {
        const json = parseJson(input.source);
        if (json === undefined) {
            return Result.fail(new AdminExtensionValidationError("Menu source is not valid JSON."));
        }

        const parsed = MenuSourceSchema.safeParse(json);
        if (!parsed.success) {
            return Result.fail(new AdminExtensionValidationError(parsed.error));
        }

        // Stored as parsed, so trimmed labels and key order are the same for every entry.
        return Result.ok({ source: JSON.stringify(parsed.data), config: "", compiled: "" });
    }
}

export const MenuSourcePreparer = AdminExtensionSourcePreparer.createImplementation({
    implementation: MenuSourcePreparerImpl,
    dependencies: []
});
