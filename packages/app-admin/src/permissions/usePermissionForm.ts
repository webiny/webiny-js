import { useMemo, useCallback } from "react";
import type {
    Permission,
    PermissionSchema,
    EntityDefinition,
    UsePermissionFormOptions,
    UsePermissionFormResult
} from "./types.js";

function hasAction(entity: EntityDefinition, name: string): boolean {
    return entity.actions?.some(a => a.name === name) ?? false;
}

/**
 * Deserialize Permission[] into form data based on the schema.
 */
function deserializePermissions(
    schema: PermissionSchema,
    value: Permission[]
): Record<string, any> {
    if (!Array.isArray(value)) {
        return { accessLevel: "no" };
    }

    // Check for full access: either wildcard or the schema's fullAccess permission.
    const hasFullAccess = value.some(p => p.name === "*" || p.name === schema.fullAccess.name);
    if (hasFullAccess) {
        return { accessLevel: "full" };
    }

    // Filter permissions that belong to this schema's prefix.
    const ownPermissions = value.filter(p => p.name.startsWith(schema.prefix));
    if (ownPermissions.length === 0) {
        return { accessLevel: "no" };
    }

    // Custom access level — extract per-entity form fields.
    const data: Record<string, any> = { accessLevel: "custom" };
    const entities = schema.entities || [];

    for (const entity of entities) {
        const perm = ownPermissions.find(p => p.name === entity.permission);
        if (!perm) {
            continue;
        }

        // Access scope: "own" if perm.own === true, else "full".
        if (perm.own === true) {
            data[`${entity.id}AccessScope`] = "own";
        } else {
            data[`${entity.id}AccessScope`] = "full";
        }

        // Process actions.
        for (const action of entity.actions ?? []) {
            if (action.name === "rwd") {
                data[`${entity.id}RWD`] = perm.rwd || "r";
            } else if (action.name === "pw") {
                data[`${entity.id}PW`] = perm.pw ? perm.pw.split("") : [];
            } else {
                // Custom boolean action.
                data[`${entity.id}Action_${action.name}`] = perm[action.name] === true;
            }
        }
    }

    return data;
}

/**
 * Serialize form data into Permission[] based on the schema.
 */
function serializePermissions(
    schema: PermissionSchema,
    formData: Record<string, any>,
    currentValue: Permission[]
): Permission[] {
    // Start by filtering out all permissions belonging to this schema's prefix.
    const filtered = Array.isArray(currentValue)
        ? currentValue.filter(p => !p.name.startsWith(schema.prefix))
        : [];

    if (formData.accessLevel === "no" || !formData.accessLevel) {
        return filtered;
    }

    if (formData.accessLevel === "full") {
        return [...filtered, { name: schema.fullAccess.name }];
    }

    const entities = schema.entities || [];

    // Custom access — build entity permissions.
    // First, build a map of entity definitions by ID for dependency lookups.
    const entityMap = new Map<string, EntityDefinition>();
    for (const entity of entities) {
        entityMap.set(entity.id, entity);
    }

    // Resolve cascading "own" scopes: if a parent is "own", children must be "own" too.
    const resolvedScopes = new Map<string, string>();
    for (const entity of entities) {
        const scope = formData[`${entity.id}AccessScope`];
        if (!scope || scope === "no") {
            continue;
        }

        let resolvedScope = scope;

        // If this entity depends on a parent and the parent scope is "own",
        // force this entity's scope to "own" as well.
        if (entity.dependsOn) {
            const parentScope = resolvedScopes.get(entity.dependsOn.entity);
            if (parentScope === "own") {
                resolvedScope = "own";
            }
        }

        resolvedScopes.set(entity.id, resolvedScope);
    }

    // Prune resolved scopes based on dependencies (must run before building permissions
    // so that transitive dependencies are properly pruned).
    for (const entity of entities) {
        if (!entity.dependsOn || !resolvedScopes.has(entity.id)) {
            continue;
        }

        const parentScope = resolvedScopes.get(entity.dependsOn.entity);
        if (!parentScope) {
            // Parent entity is not enabled — prune child.
            resolvedScopes.delete(entity.id);
            continue;
        }

        const parentEntity = entityMap.get(entity.dependsOn.entity);
        if (parentEntity && hasAction(parentEntity, "rwd")) {
            const parentRwd =
                parentScope === "own" ? "rwd" : formData[`${entity.dependsOn.entity}RWD`] || "r";
            if (!parentRwd.includes(entity.dependsOn.requires)) {
                // Parent doesn't have the required action — prune child.
                resolvedScopes.delete(entity.id);
            }
        }
    }

    // Build permissions from the pruned resolved scopes.
    const permissions: Permission[] = [];

    for (const entity of entities) {
        const scope = resolvedScopes.get(entity.id);
        if (!scope) {
            continue;
        }

        const perm: Permission = {
            name: entity.permission
        };

        if (scope === "own") {
            perm.own = true;
            if (hasAction(entity, "rwd")) {
                perm.rwd = "rwd";
            }
        } else if (hasAction(entity, "rwd")) {
            perm.rwd = formData[`${entity.id}RWD`] || "r";
        }

        // Process non-rwd actions.
        for (const action of entity.actions ?? []) {
            if (action.name === "rwd") {
                continue; // Already handled above.
            }

            if (action.name === "pw") {
                const pw: string[] = formData[`${entity.id}PW`] || [];
                if (pw.length > 0) {
                    perm.pw = pw.join("");
                }
            } else {
                // Custom boolean action.
                if (formData[`${entity.id}Action_${action.name}`]) {
                    perm[action.name] = true;
                }
            }
        }

        permissions.push(perm);
    }

    return [...filtered, ...permissions];
}

/**
 * Hook that bridges a permission schema with a Form component.
 *
 * Handles bidirectional transformation between Permission[] and form data,
 * with optional custom serialize/deserialize callbacks for app-specific needs.
 */
export function usePermissionForm(
    schema: PermissionSchema,
    options: UsePermissionFormOptions
): UsePermissionFormResult {
    const { value, onChange } = options;

    const formData = useMemo(() => {
        let data = deserializePermissions(schema, value);

        // Merge custom deserialized data if provided.
        if (options.deserialize) {
            const extra = options.deserialize(Array.isArray(value) ? value : []);
            data = { ...data, ...extra };
        }

        return data;
    }, []);

    const onFormChange = useCallback(
        (data: Record<string, any>) => {
            let result = serializePermissions(schema, data, value);

            // Apply custom serializer if provided.
            if (options.serialize) {
                result = options.serialize(
                    data,
                    result.filter(p => p.name.startsWith(schema.prefix))
                );
                // Re-add non-schema permissions that were filtered out.
                const nonSchemaPermissions = Array.isArray(value)
                    ? value.filter(p => !p.name.startsWith(schema.prefix))
                    : [];
                result = [...nonSchemaPermissions, ...result];
            }

            onChange(result);
        },
        [value]
    );

    return { formData, onFormChange };
}

// Export the pure functions for unit testing.
export { deserializePermissions, serializePermissions };
