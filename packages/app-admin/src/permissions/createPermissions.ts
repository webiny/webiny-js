import { createAbstraction } from "@webiny/feature/admin";
import { createFeature } from "@webiny/feature/admin";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import type { IIdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import type { Identity } from "~/domain/Identity.js";
import type { PermissionSchemaConfig, OwnableItem, UsePermissionsResult } from "./types.js";

interface EntityLookup {
    permission: string;
    actions: Set<string>;
    hasOwn: boolean;
}

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

/**
 * Check whether the identity has unrestricted full access for the given schema prefix.
 * Stricter than the legacy check: `{ name: "wb.*", rwd: "r" }` is NOT full access.
 */
function hasFullSchemaAccess(identity: Identity, prefix: string): boolean {
    const fullAccessName = `${prefix}.*`;
    const permission = identity.getPermission(fullAccessName);
    if (!permission) {
        return false;
    }
    // If any restricting keys are present, this is not full access.
    if (typeof permission.rwd === "string" || typeof permission.pw === "string") {
        return false;
    }
    return true;
}

class SchemaPermissions<S extends PermissionSchemaConfig> {
    private readonly schema: S;
    private readonly entityMap: Map<string, EntityLookup>;
    private readonly identityContext: IIdentityContext;

    constructor(schema: S, identityContext: IIdentityContext) {
        this.schema = schema;
        this.entityMap = buildEntityMap(schema);
        this.identityContext = identityContext;
    }

    private get identity(): Identity {
        return this.identityContext.getIdentity();
    }

    private get fullAccess(): boolean {
        return hasFullSchemaAccess(this.identity, this.schema.prefix);
    }

    canAccess(entityId: string): boolean {
        if (this.fullAccess) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        return this.identity.getPermissions(entity.permission).length > 0;
    }

    canRead(entityId: string): boolean {
        if (this.fullAccess) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = this.identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            if (typeof permission.rwd !== "string") {
                return true;
            }
            return permission.rwd.includes("r");
        });
    }

    canCreate(entityId: string): boolean {
        if (this.fullAccess) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = this.identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            if (typeof permission.rwd !== "string") {
                return true;
            }
            return permission.rwd.includes("w");
        });
    }

    canEdit(entityId: string, item?: OwnableItem): boolean {
        if (this.fullAccess) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = this.identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            if (permission.own) {
                if (!item?.createdBy) {
                    return true;
                }
                return item.createdBy.id === this.identity.id;
            }
            if (typeof permission.rwd !== "string") {
                return true;
            }
            return permission.rwd.includes("w");
        });
    }

    canDelete(entityId: string, item?: OwnableItem): boolean {
        if (this.fullAccess) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = this.identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            if (permission.own) {
                return item?.createdBy?.id === this.identity.id;
            }
            if (typeof permission.rwd !== "string") {
                return true;
            }
            return permission.rwd.includes("d");
        });
    }

    canPublish(entityId: string): boolean {
        if (this.fullAccess) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = this.identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            return permission.pw?.includes("p");
        });
    }

    canUnpublish(entityId: string): boolean {
        if (this.fullAccess) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = this.identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            return permission.pw?.includes("u");
        });
    }

    canAction(action: string, entityId: string): boolean {
        if (this.fullAccess) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = this.identity.getPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            return permission[action] === true;
        });
    }
}

export function createPermissions<const S extends PermissionSchemaConfig>(schema: S) {
    const Permissions = createAbstraction<UsePermissionsResult<S>>(`${schema.prefix}:Permissions`);

    class PermissionsImpl extends SchemaPermissions<S> {
        constructor(identityContext: IIdentityContext) {
            super(schema, identityContext);
        }
    }

    const Implementation = Permissions.createImplementation({
        implementation: PermissionsImpl,
        dependencies: [IdentityContext]
    });

    const Feature = createFeature({
        name: `${schema.prefix}:Permissions`,
        register(container) {
            container.register(Implementation).inSingletonScope();
        },
        resolve(container) {
            return { permissions: container.resolve(Permissions) };
        }
    });

    return { Abstraction: Permissions, Feature, schema };
}
