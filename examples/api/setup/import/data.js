import { User, Role, RoleGroup } from "webiny-api-security";

export default [
    () => {
        return {
            entity: Role,
            data: [
                {
                    name: "Administrator",
                    slug: "administrator",
                    description: "Administrator account"
                },
                {
                    name: "ACL Manager",
                    slug: "webiny-acl-manager",
                    description: "Manage ACL"
                }
            ]
        };
    },
    async () => {
        return {
            entity: RoleGroup,
            data: [
                {
                    name: "Administrators",
                    slug: "administrators",
                    description: "Administrator group",
                    roles: [
                        await Role.findOne({ query: { slug: "administrator" } }),
                        await Role.findOne({ query: { slug: "webiny-acl-manager" } })
                    ]
                }
            ]
        };
    },
    async () => {
        return {
            entity: User,
            data: [
                {
                    email: "user1@webiny.com",
                    password: "pass1",
                    roleGroups: [await RoleGroup.findOne({ query: { slug: "administrators" } })]
                },
                {
                    email: "user2@webiny.com",
                    password: "pass2",
                    roleGroups: [await RoleGroup.findOne({ query: { slug: "administrators" } })]
                }
            ]
        };
    }
];
