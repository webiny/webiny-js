import { createPermissionSchema } from "@webiny/app-admin";

export const DEV_TOOLS_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "dev-tools",
    fullAccess: true,
    entities: [
        {
            id: "graphql-playground",
            title: "GraphQL Playground",
            permission: "dev-tools.graphql-playground.*",
            scopes: ["full"]
        }
    ]
});
