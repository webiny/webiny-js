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
    }
];
