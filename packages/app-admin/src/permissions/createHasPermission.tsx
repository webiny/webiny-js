import React from "react";
import type { Abstraction } from "@webiny/di";
import type { HasPermissionProps, PermissionSchemaConfig, UsePermissionsResult } from "./types.js";
import { useContainer } from "@webiny/app";

const BUILT_IN_ACTIONS: Record<string, string> = {
    read: "canRead",
    create: "canCreate",
    edit: "canEdit",
    delete: "canDelete",
    publish: "canPublish",
    unpublish: "canUnpublish"
};

export function createHasPermission<const S extends PermissionSchemaConfig>(
    abstraction: Abstraction<UsePermissionsResult<S>>,
    // This parameter is used for type inference
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    schema: S
): React.FC<HasPermissionProps<S>> {
    return function HasPermission({ children, ...props }) {
        const container = useContainer();
        const permissions = container.resolve(abstraction);

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
            return (permissions.canAction as (action: string, entityId: string) => boolean)(
                singleAction,
                entityId
            );
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
