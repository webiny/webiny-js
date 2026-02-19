import type { PermissionSchemaConfig, PermissionSchema } from "./types.js";

export function createPermissionSchema(config: PermissionSchemaConfig): PermissionSchema {
    return {
        prefix: config.prefix,
        fullAccess: config.fullAccess,
        entities: config.entities ?? []
    };
}
