import { createAbstraction } from "@webiny/feature/api";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "~/types/security.js";
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

export function createPermissions<const S extends PermissionSchemaConfig>(schema: S) {
    const entityMap = buildEntityMap(schema);

    class SchemaPermissions {
        constructor(private identityContext: IdentityContext.Interface) {}

        async canAccess(entityId: string, item?: OwnableItem): Promise<boolean> {
            if (await this.identityContext.hasFullAccess()) {
                return true;
            }
            if (await this.hasFullSchemaAccess()) {
                return true;
            }
            const entity = getEntity(entityMap, entityId);
            const permissions = await this.identityContext.getPermissions(entity.permission);
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
            const entity = getEntity(entityMap, entityId);
            const permissions = await this.identityContext.getPermissions(entity.permission);
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
            const entity = getEntity(entityMap, entityId);
            const permissions = await this.identityContext.getPermissions(entity.permission);
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
            const entity = getEntity(entityMap, entityId);
            const permissions = await this.identityContext.getPermissions(entity.permission);
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
            const entity = getEntity(entityMap, entityId);
            const permissions = await this.identityContext.getPermissions(entity.permission);
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
            const entity = getEntity(entityMap, entityId);
            const permissions = await this.identityContext.getPermissions(entity.permission);
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
            const entity = getEntity(entityMap, entityId);
            const permissions = await this.identityContext.getPermissions(entity.permission);
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
            const entity = getEntity(entityMap, entityId);
            const permissions = await this.identityContext.getPermissions(entity.permission);
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
            const entity = getEntity(entityMap, entityId);
            const permissions = await this.identityContext.getPermissions(entity.permission);
            if (!permissions.length) {
                return false;
            }
            return permissions.some(permission => {
                return permission[action] === true;
            });
        }

        private async hasFullSchemaAccess(): Promise<boolean> {
            const permission = await this.identityContext.getPermission(schema.fullAccess.name);
            return permission !== null;
        }
    }

    const Abstraction = createAbstraction<Permissions<S>>(`${schema.prefix}:Permissions`);

    const Implementation = Abstraction.createImplementation({
        implementation: SchemaPermissions,
        dependencies: [IdentityContext]
    } as any);

    return { Abstraction, Implementation };
}
