import { createPermissionSchema } from "@webiny/app-admin";

export const DEV_TOOLS_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "dev-tools",
    fullAccess: true,
    entities: [
        {
            id: "graphql-playground",
            title: "GraphQL Playground",
            permission: "graphql-playground.*",
            scopes: ["full"]
        },
        {
            id: "sdk-playground",
            title: "SDK Playground",
            permission: "sdk-playground.*",
            scopes: ["full"]
        }
    ]
});
