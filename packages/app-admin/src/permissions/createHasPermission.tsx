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
                return permissions.canAccess(entityId);
            }
            const method = BUILT_IN_ACTIONS[singleAction] as keyof typeof permissions;
            if (method && typeof permissions[method] === "function") {
                return permissions[method](entityId);
            }
            /**
             * // TODO cant be typed properly because of the dynamic nature of custom actions.
             */
            // @ts-expect-error
            return permissions.canAction(singleAction, entityId);
        };

        const check = (entityId: string): boolean => {
            if (Array.isArray(action)) {
                if (requireAllActions) {
                    return action.every(act => {
                        return checkAction(entityId, act);
                    });
                }
                return action.some(act => {
                    return checkAction(entityId, act);
                });
            }
            return checkAction(entityId, action);
        };

        const allowed = requireAll ? entities.every(check) : entities.some(check);

        return allowed ? <>{children}</> : null;
    };
}
