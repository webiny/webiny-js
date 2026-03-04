import { createPermissions } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";

const schema = {
    prefix: "fm",
    fullAccess: true,
    entities: [
        {
            id: "file",
            permission: "fm.file",
            scopes: ["full", "own"],
            actions: [{ name: "rwd" }]
        },
        {
            id: "settings",
            permission: "fm.settings",
            scopes: ["full"]
        }
    ]
} as const;

type FmSchema = typeof schema;

export const FmPermissions = createPermissions(schema);

export namespace FmPermissions {
    export type Interface = Permissions<FmSchema>;
}
