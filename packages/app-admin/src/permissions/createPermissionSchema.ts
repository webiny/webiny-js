import type { PermissionSchemaConfig } from "./types.js";

export function createPermissionSchema<const T extends PermissionSchemaConfig>(config: T): T {
    return {
        ...config,
        entities: config.entities ?? []
    };
}
