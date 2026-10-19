import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { AdminExtension } from "~/api/adminExtensions/domain/AdminExtension.js";
import type { AdminExtensionKind } from "~/shared/adminExtensions/constants.js";
import type { AdminExtensionModelNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionNotAuthorizedError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionPersistenceError } from "~/api/adminExtensions/domain/errors.js";

type IError =
    | AdminExtensionModelNotFoundError
    | AdminExtensionNotAuthorizedError
    | AdminExtensionPersistenceError;

export interface IListEnabledAdminExtensionsUseCase {
    execute(kind: AdminExtensionKind): Promise<Result<AdminExtension[], IError>>;
}

/**
 * What the admin loads at startup: the enabled extensions of one kind.
 *
 * Open to every signed-in identity, not only to whoever manages extensions. A menu has to appear for
 * everyone who uses the admin, so gating this on the management permission would hide it from the
 * people it was made for.
 */
export const ListEnabledAdminExtensionsUseCase =
    createAbstraction<IListEnabledAdminExtensionsUseCase>(
        "RemoteComponents/ListEnabledAdminExtensionsUseCase"
    );

export namespace ListEnabledAdminExtensionsUseCase {
    export type Interface = IListEnabledAdminExtensionsUseCase;
    export type Error = IError;
}
