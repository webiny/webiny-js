import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { AdminExtensionKind } from "~/shared/adminExtensions/constants.js";
import type { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";

export interface IAdminExtensionSourceInput {
    source: string;
    /** Kind-specific settings as JSON, e.g. which field type a renderer is for. Empty for menus. */
    config: string;
}

export interface IPreparedAdminExtensionSource {
    source: string;
    config: string;
    /** What the admin runs. Empty for config kinds, compiled JavaScript for code kinds. */
    compiled: string;
}

export interface IAdminExtensionSourcePreparer {
    readonly kind: AdminExtensionKind;
    /** Checks, normalizes and, for a code kind, compiles what is about to be saved. */
    prepare(
        input: IAdminExtensionSourceInput
    ): Promise<Result<IPreparedAdminExtensionSource, AdminExtensionValidationError>>;
}

/**
 * Turns one kind's input into what is stored. A kind with no preparer registered cannot be created
 * at all, so a kind is only writable once something knows what its source must look like.
 *
 * Code is compiled here, at write time, so a renderer that does not compile is rejected before
 * anyone approves it and the caller can fix it straight away.
 */
export const AdminExtensionSourcePreparer = createAbstraction<IAdminExtensionSourcePreparer>(
    "RemoteComponents/AdminExtensionSourcePreparer"
);

export namespace AdminExtensionSourcePreparer {
    export type Interface = IAdminExtensionSourcePreparer;
    export type Input = IAdminExtensionSourceInput;
    export type Prepared = IPreparedAdminExtensionSource;
}
