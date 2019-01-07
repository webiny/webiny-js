// @flow
export default [
    {
        name: "Security - Roles",
        description: "Allows management of roles.",
        slug: "security-roles",
        scopes: ["security:role:crud"],
        system: true
    },
    {
        name: "Security - Groups",
        description: "Allows management of groups.",
        slug: "security-groups",
        scopes: ["security:group:crud"],
        system: true
    },
    {
        name: "Security - Users",
        description: "Allows management of users.",
        slug: "security-users",
        scopes: ["security:user:crud"],
        system: true
    }
];
