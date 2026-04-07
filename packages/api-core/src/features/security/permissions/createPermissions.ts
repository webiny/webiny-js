import { createAbstraction } from "@webiny/feature/api";
import { createFeature } from "@webiny/feature/api";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import type { Abstraction } from "@webiny/di";
import type { PermissionSchemaConfig } from "./types.js";
import type { OwnableItem } from "./types.js";
import type { Permissions } from "./types.js";

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

class SchemaPermissions<S extends PermissionSchemaConfig> {
    private readonly entityMap: Map<string, EntityLookup>;
    private readonly fullAccessName: string;
    private readonly identityContext: IdentityContext.Interface;

    constructor(schema: S, identityContext: IdentityContext.Interface) {
        this.entityMap = buildEntityMap(schema);
        this.fullAccessName = `${schema.prefix}.*`;
        this.identityContext = identityContext;
    }

    async canAccess(entityId: string, item?: OwnableItem): Promise<boolean> {
        if (await this.identityContext.hasFullAccess()) {
            return true;
        }
        if (await this.hasFullSchemaAccess()) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = await this.getEntityPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        // No item — just check entity-level access.
        if (item === undefined) {
            return true;
        }
        // Item provided — if all permissions require own, verify ownership.
        const ownOnly = !permissions.some(p => !p.own);
        if (!ownOnly) {
            return true;
        }
        const identity = this.identityContext.getIdentity();
        return item.createdBy?.id === identity.id;
    }

    async onlyOwnRecords(entityId: string): Promise<boolean> {
        if (await this.identityContext.hasFullAccess()) {
            return false;
        }
        if (await this.hasFullSchemaAccess()) {
            return false;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = await this.getEntityPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return !permissions.some(p => !p.own);
    }

    async canRead(entityId: string): Promise<boolean> {
        if (await this.identityContext.hasFullAccess()) {
            return true;
        }
        if (await this.hasFullSchemaAccess()) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = await this.getEntityPermissions(entity.permission);
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

    async canCreate(entityId: string): Promise<boolean> {
        if (await this.identityContext.hasFullAccess()) {
            return true;
        }
        if (await this.hasFullSchemaAccess()) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = await this.getEntityPermissions(entity.permission);
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

    async canEdit(entityId: string, item?: OwnableItem): Promise<boolean> {
        if (await this.identityContext.hasFullAccess()) {
            return true;
        }
        if (await this.hasFullSchemaAccess()) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = await this.getEntityPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        const identity = this.identityContext.getIdentity();
        return permissions.some(permission => {
            if (permission.own) {
                // No item provided (new/unsaved) — allow access.
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
    }

    async canDelete(entityId: string, item?: OwnableItem): Promise<boolean> {
        if (await this.identityContext.hasFullAccess()) {
            return true;
        }
        if (await this.hasFullSchemaAccess()) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = await this.getEntityPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        const identity = this.identityContext.getIdentity();
        return permissions.some(permission => {
            if (permission.own) {
                return item?.createdBy?.id === identity.id;
            }
            if (typeof permission.rwd !== "string") {
                return true;
            }
            return permission.rwd.includes("d");
        });
    }

    async canPublish(entityId: string): Promise<boolean> {
        if (await this.identityContext.hasFullAccess()) {
            return true;
        }
        if (await this.hasFullSchemaAccess()) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = await this.getEntityPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            return permission.pw?.includes("p");
        });
    }

    async canUnpublish(entityId: string): Promise<boolean> {
        if (await this.identityContext.hasFullAccess()) {
            return true;
        }
        if (await this.hasFullSchemaAccess()) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = await this.getEntityPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            return permission.pw?.includes("u");
        });
    }

    async canAction(action: string, entityId: string): Promise<boolean> {
        if (await this.identityContext.hasFullAccess()) {
            return true;
        }
        if (await this.hasFullSchemaAccess()) {
            return true;
        }
        const entity = getEntity(this.entityMap, entityId);
        const permissions = await this.getEntityPermissions(entity.permission);
        if (!permissions.length) {
            return false;
        }
        return permissions.some(permission => {
            return permission[action] === true;
        });
    }

    private async getEntityPermissions(entityPermission: string): Promise<any[]> {
        const permissions = await this.identityContext.getPermissions(entityPermission);
        if (permissions.length) {
            return permissions;
        }
        // Fall back to the schema wildcard (e.g. "test.*") — its flags apply to all entities.
        const wildcard = await this.identityContext.getPermission(this.fullAccessName);
        return wildcard ? [wildcard] : [];
    }

    private async hasFullSchemaAccess(): Promise<boolean> {
        const permission = await this.identityContext.getPermission(this.fullAccessName);
        if (!permission) {
            return false;
        }
        // Only treat as full access if the permission has no `rwd` flag.
        // A permission like { name: "wb.*", rwd: "r" } should NOT grant full access.
        const keys = Object.keys(permission).filter(k => k !== "name");

        const hasRwd = keys.includes("rwd");

        // It's full-access only if there's no `rwd` flag.
        return !hasRwd;
    }
}

export function createPermissionsAbstraction<const S extends PermissionSchemaConfig>(schema: S) {
    return createAbstraction<Permissions<S>>(`${schema.prefix}:Permissions`);
}

export function createPermissionsFeature<const S extends PermissionSchemaConfig>(
    schema: S,
    abstraction: Abstraction<Permissions<S>>
) {
    class PermissionsImpl extends SchemaPermissions<S> {
        constructor(identityContext: IdentityContext.Interface) {
            super(schema, identityContext);
        }
    }

    const Implementation = abstraction.createImplementation({
        implementation: PermissionsImpl,
        dependencies: [IdentityContext]
    } as any);

    return createFeature({
        name: `${schema.prefix}:Permissions`,
        register(container) {
            container.register(Implementation);
        }
    });
}
