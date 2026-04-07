import React from "react";
import { createUsePermissions } from "./usePermissions.js";
import type { Abstraction } from "@webiny/di";
import type { HasPermissionProps, PermissionSchemaConfig, UsePermissionsResult } from "./types.js";

const BUILT_IN_ACTIONS: Record<string, string> = {
    read: "canRead",
    create: "canCreate",
    edit: "canEdit",
    delete: "canDelete",
    publish: "canPublish",
    unpublish: "canUnpublish"
};

interface DiPermissions<S extends PermissionSchemaConfig> {
    Abstraction: Abstraction<UsePermissionsResult<S>>;
    schema: S;
}

/**
 * @deprecated Pass `createPermissions(schema)` result instead of a raw schema.
 */
export function createHasPermission<const S extends PermissionSchemaConfig>(
    schema: S
): React.FC<HasPermissionProps<S>>;

export function createHasPermission<const S extends PermissionSchemaConfig>(
    permissions: DiPermissions<S>
): React.FC<HasPermissionProps<S>>;

export function createHasPermission<const S extends PermissionSchemaConfig>(
    schemaOrPermissions: S | DiPermissions<S>
): React.FC<HasPermissionProps<S>> {
    // TODO: temporary cast - this code will be refactored to only use DiPermissions
    const usePermissions = createUsePermissions(schemaOrPermissions as any);

    return function HasPermission({ children, ...props }) {
        const permissions = usePermissions();

        const action = props.action as string | undefined;
        const someActions = props.someActions as string[] | undefined;
        const allActions = props.allActions as string[] | undefined;
        const entities: string[] = props.entity ? [props.entity] : (props.any ?? props.all ?? []);
        const requireAll = !!props.all;

        const checkAction = (entityId: string, singleAction: string | undefined): boolean => {
            if (!singleAction) {
                return permissions.canAccess(entityId);
            }
            const method = BUILT_IN_ACTIONS[singleAction] as keyof typeof permissions;
            if (method && typeof permissions[method] === "function") {
                return (permissions[method] as (entityId: string) => boolean)(entityId);
            }
            return permissions.canAction(singleAction, entityId);
        };

        const check = (entityId: string): boolean => {
            if (allActions) {
                return allActions.every(act => checkAction(entityId, act));
            }
            if (someActions) {
                return someActions.some(act => checkAction(entityId, act));
            }
            return checkAction(entityId, action);
        };

        const allowed = requireAll ? entities.every(check) : entities.some(check);

        return allowed ? <>{children}</> : null;
    };
}
