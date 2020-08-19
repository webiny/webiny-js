export default [
    {
        name: "Anonymous",
        description: "Controls what anonymous requests can access.",
        slug: "anonymous",
        permissions: [],
        system: true
    },
    {
        name: "Security - Roles",
        description: "Allows management of roles.",
        slug: "security-roles",
        permissions: [{ name: "security.role.crud" }],
        system: true
    },
    {
        name: "Security - Groups",
        description: "Allows management of groups.",
        slug: "security-groups",
        permissions: [{ name: "security.group.crud" }],
        system: true
    },
    {
        name: "Security - Users",
        description: "Allows management of users.",
        slug: "security-users",
        permissions: [{ name: "security.user.crud" }],
        system: true
    }
];
