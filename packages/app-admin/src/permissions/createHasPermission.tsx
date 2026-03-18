import React from "react";
import { createUsePermissions } from "./usePermissions.js";
import type { HasPermissionProps, PermissionSchemaConfig } from "./types.js";

const BUILT_IN_ACTIONS: Record<string, string> = {
    read: "canRead",
    create: "canCreate",
    edit: "canEdit",
    delete: "canDelete",
    publish: "canPublish",
    unpublish: "canUnpublish"
};

export function createHasPermission<const S extends PermissionSchemaConfig>(
    schema: S
): React.FC<HasPermissionProps<S>> {
    const usePermissions = createUsePermissions(schema);

    return function HasPermission({ children, ...props }) {
        const permissions = usePermissions();

        const action = props.action as string | string[] | undefined;
        const entities: string[] = props.entity ? [props.entity] : (props.any ?? props.all ?? []);
        const requireAll = !!props.all;
        const requireAllActions = !!props.requireAllActions;

        const checkAction = (entityId: string, singleAction: string | undefined): boolean => {
            if (!singleAction) {
                return permissions.canAccess(entityId as any);
            }
            const method = BUILT_IN_ACTIONS[singleAction];
            if (method) {
                return (permissions as any)[method](entityId);
            }
            return permissions.canAction(singleAction as any, entityId as any);
        };

        const check = (entityId: string): boolean => {
            if (Array.isArray(action)) {
                if (requireAllActions) {
                    return action.every(act => checkAction(entityId, act));
                }
                return action.some(act => checkAction(entityId, act));
            }
            return checkAction(entityId, action);
        };

        const allowed = requireAll ? entities.every(check) : entities.some(check);

        return allowed ? <>{children}</> : null;
    };
}
