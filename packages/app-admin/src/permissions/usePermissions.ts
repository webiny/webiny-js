import { useIdentity } from "~/presentation/security/hooks/useIdentity.js";
import { useContainer } from "@webiny/app";
import type { Abstraction } from "@webiny/di";
import type { Identity } from "~/domain/Identity.js";
import type { PermissionSchemaConfig } from "./types.js";
import type { OwnableItem } from "./types.js";
import type { UsePermissionsResult } from "./types.js";

interface EntityLookup {
    permission: string;
    actions: Set<string>;
    hasOwn: boolean;
}

// Module-level cache: schema -> identityId -> result.
const cache = new WeakMap<PermissionSchemaConfig, Map<string, UsePermissionsResult<any>>>();

function buildEntityMap(schema: PermissionSchemaConfig): Map<string, EntityLookup> {
    const map = new Map<string, EntityLookup>();
    for (const entity of schema.entities ?? []) {
        const actions = new Set<string>();
        for (const action of entity.actions ?? []) {
            actions.add(action.name);
        }
        map.set(entity.id, {
            permission: entity.permission,
            actions,
            hasOwn: entity.scopes.includes("own")
        });
    }
    return map;
}

function getEntity(entityMap: Map<string, EntityLookup>, entityId: string): EntityLookup {
    const entity = entityMap.get(entityId);
    if (!entity) {
        throw new Error(`Unknown entity "${entityId}" in permission schema.`);
    }
    return entity;
}

function buildResult<S extends PermissionSchemaConfig>(
    schema: S,
    identity: Identity
): UsePermissionsResult<S> {
    const fullAccessName = `${schema.prefix}.*`;
    const hasFullAccess = !!identity.getPermission(fullAccessName);
    const entityMap = buildEntityMap(schema);

    const canAccess = (entityId: string): boolean => {
        if (hasFullAccess) {
            return true;
        }
        const entity = getEntity(entityMap, entityId);
        const permissions = identity.getPermissions(entity.permission);
        return permissions.length > 0;
    };

    const canRead = (entityId: string): boolean => {
        if (hasFullAccess) {
            return true;
        }
        const entity = getEntity(entityMap, entityId);
        const permissions = identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            if (typeof permission.rwd !== "string") {
                return true;
            }
            return permission.rwd.includes("r");
        });
    };

    const canCreate = (entityId: string): boolean => {
        if (hasFullAccess) {
            return true;
        }
        const entity = getEntity(entityMap, entityId);
        const permissions = identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            if (typeof permission.rwd !== "string") {
                return true;
            }
            return permission.rwd.includes("w");
        });
    };

    const canEdit = (entityId: string, item?: OwnableItem): boolean => {
        if (hasFullAccess) {
            return true;
        }
        const entity = getEntity(entityMap, entityId);
        const permissions = identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            if (permission.own) {
                if (!item?.createdBy) {
                    return true;
                }
                return item.createdBy.id === identity.id;
            }
            if (typeof permission.rwd !== "string") {
                return true;
            }
            return permission.rwd.includes("w");
        });
    };

    const canDelete = (entityId: string, item?: OwnableItem): boolean => {
        if (hasFullAccess) {
            return true;
        }
        const entity = getEntity(entityMap, entityId);
        const permissions = identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            if (permission.own) {
                return item?.createdBy?.id === identity.id;
            }
            if (typeof permission.rwd !== "string") {
                return true;
            }
            return permission.rwd.includes("d");
        });
    };

    const canPublish = (entityId: string): boolean => {
        if (hasFullAccess) {
            return true;
        }
        const entity = getEntity(entityMap, entityId);
        const permissions = identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            return permission.pw?.includes("p");
        });
    };

    const canUnpublish = (entityId: string): boolean => {
        if (hasFullAccess) {
            return true;
        }
        const entity = getEntity(entityMap, entityId);
        const permissions = identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            return permission.pw?.includes("u");
        });
    };

    const canAction = (action: string, entityId: string): boolean => {
        if (hasFullAccess) {
            return true;
        }
        const entity = getEntity(entityMap, entityId);
        const permissions = identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            return permission[action] === true;
        });
    };

    return {
        canAccess,
        canRead,
        canCreate,
        canEdit,
        canDelete,
        canPublish,
        canUnpublish,
        canAction
    } as UsePermissionsResult<S>;
}

interface DiPermissions<S extends PermissionSchemaConfig> {
    Abstraction: Abstraction<UsePermissionsResult<S>>;
    schema: S;
}

function isDiPermissions<S extends PermissionSchemaConfig>(
    arg: S | DiPermissions<S>
): arg is DiPermissions<S> {
    return "Abstraction" in arg;
}

/**
 * @deprecated Pass `createPermissions(schema)` result instead of a raw schema.
 */
export function createUsePermissions<const S extends PermissionSchemaConfig>(
    schema: S
): () => UsePermissionsResult<S>;

export function createUsePermissions<const S extends PermissionSchemaConfig>(
    permissions: DiPermissions<S>
): () => UsePermissionsResult<S>;

export function createUsePermissions<const S extends PermissionSchemaConfig>(
    schemaOrPermissions: S | DiPermissions<S>
): () => UsePermissionsResult<S> {
    if (isDiPermissions(schemaOrPermissions)) {
        const abstraction = schemaOrPermissions.Abstraction;
        return function usePermissions(): UsePermissionsResult<S> {
            const container = useContainer();
            return container.resolve(abstraction);
        };
    }

    const schema = schemaOrPermissions;
    return function usePermissions(): UsePermissionsResult<S> {
        const { identity } = useIdentity();

        let byIdentityId = cache.get(schema);
        if (!byIdentityId) {
            byIdentityId = new Map();
            cache.set(schema, byIdentityId);
        }

        let result = byIdentityId.get(identity.id) as UsePermissionsResult<S> | undefined;
        if (!result) {
            result = buildResult(schema, identity);
            byIdentityId.set(identity.id, result as UsePermissionsResult<any>);
        }

        return result;
    };
}
