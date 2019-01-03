// @flow
export default [
    {
        name: "Security - Roles",
        description: "Allows management of roles.",
        slug: "security-roles",
        scopes: [
            "security:role:get",
            "security:role:list",
            "security:role:create",
            "security:role:update",
            "security:role:delete"
        ]
    },
    {
        name: "Security - Groups",
        description: "Allows management of groups.",
        slug: "security-groups",
        scopes: [
            "security:group:get",
            "security:group:list",
            "security:group:create",
            "security:group:update",
            "security:group:delete"
        ]
    },
    {
        name: "Security - Users",
        description: "Allows management of users.",
        slug: "security-users",
        scopes: [
            "security:user:create",
            "security:user:get",
            "security:user:list",
            "security:user:update",
            "security:user:delete"
        ]
    },
    {
        name: "Security - API tokens",
        description: "Allows management of API tokens.",
        slug: "security-api-tokens",
        scopes: [
            "security:api_token:get",
            "security:api_token:list",
            "security:api_token:create",
            "security:api_token:update",
            "security:api_token:delete"
        ]
    }
];
