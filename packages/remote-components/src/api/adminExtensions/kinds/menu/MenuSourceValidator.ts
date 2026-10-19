import { Result } from "@webiny/feature/api";
import { AdminExtensionSourceValidator } from "~/api/adminExtensions/features/AdminExtensionSourceValidator/abstractions.js";
import { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";
import { MenuSourceSchema } from "~/shared/adminExtensions/menuSource.js";

function parseJson(source: string): unknown {
    try {
        return JSON.parse(source);
    } catch {
        return undefined;
    }
}

class MenuSourceValidatorImpl implements AdminExtensionSourceValidator.Interface {
    readonly kind = "menu" as const;

    validate(source: string): Result<string, AdminExtensionValidationError> {
        const json = parseJson(source);
        if (json === undefined) {
            return Result.fail(new AdminExtensionValidationError("Menu source is not valid JSON."));
        }

        const parsed = MenuSourceSchema.safeParse(json);
        if (!parsed.success) {
            return Result.fail(new AdminExtensionValidationError(parsed.error));
        }

        // Stored as parsed, so trimmed labels and key order are the same for every entry.
        return Result.ok(JSON.stringify(parsed.data));
    }
}

export const MenuSourceValidator = AdminExtensionSourceValidator.createImplementation({
    implementation: MenuSourceValidatorImpl,
    dependencies: []
});
