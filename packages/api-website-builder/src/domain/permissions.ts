import { createPermissions } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";

const schema = {
    prefix: "wb",
    fullAccess: true,
    entities: [
        {
            id: "page",
            permission: "wb.page",
            scopes: ["full", "own"],
            actions: [{ name: "rwd" }, { name: "pw" }]
        },
        {
            id: "redirect",
            permission: "wb.redirect",
            scopes: ["full", "own"],
            actions: [{ name: "rwd" }]
        },
        {
            id: "settings",
            permission: "wb.settings",
            scopes: ["full"]
        },
        {
            id: "integrations",
            permission: "wb.integrations",
            scopes: ["full"]
        }
    ]
} as const;

type WbSchema = typeof schema;

export const WbPermissions = createPermissions(schema);

export namespace WbPermissions {
    export type Interface = Permissions<WbSchema>;
}
