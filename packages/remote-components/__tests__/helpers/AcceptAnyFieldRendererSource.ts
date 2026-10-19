import { Result } from "@webiny/feature/api";
import { AdminExtensionSourceValidator } from "~/api/adminExtensions/features/AdminExtensionSourceValidator/abstractions.js";

/*
 * Field renderers have no validator yet, so they cannot be created. Tests that need a second kind
 * register this one, which accepts any source as it is.
 */
class AcceptAnyFieldRendererSourceImpl implements AdminExtensionSourceValidator.Interface {
    readonly kind = "fieldRenderer" as const;

    validate(source: string) {
        return Result.ok(source);
    }
}

export const AcceptAnyFieldRendererSource = AdminExtensionSourceValidator.createImplementation({
    implementation: AcceptAnyFieldRendererSourceImpl,
    dependencies: []
});
