import { useContainer } from "@webiny/app";
import type { Abstraction } from "@webiny/di";
import type { PermissionSchemaConfig } from "./types.js";
import type { UsePermissionsResult } from "./types.js";

export function createUsePermissions<const S extends PermissionSchemaConfig>(
    abstraction: Abstraction<UsePermissionsResult<S>>
): () => UsePermissionsResult<S> {
    return function usePermissions(): UsePermissionsResult<S> {
        const container = useContainer();
        return container.resolve(abstraction);
    };
}
