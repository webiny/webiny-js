// @flow
import { Policy } from "./../../entities";

export default async () => {
    const entity = new Policy();
    entity.populate({
        name: "SecurityFullAccess",
        description: "Full access to low-level security settings and identities management.",
        slug: "security-full-access",
        system: true,
        permissions: {
            api: {
                Security: {
                    Groups: {
                        create: {
                            id: true,
                            name: true,
                            slug: true,
                            system: true,
                            description: true,
                            policies: ["id", "name"]
                        },
                        update: {
                            id: true,
                            name: true,
                            slug: true,
                            system: true,
                            description: true,
                            policies: ["id", "name"]
                        },
                        one: {
                            id: true,
                            name: true,
                            slug: true,
                            system: true,
                            description: true,
                            policies: ["id", "name"]
                        },
                        delete: true,
                        list: {
                            data: ["id", "name", "description", "createdOn", "system"],
                            meta: [
                                "count",
                                "totalCount",
                                "from",
                                "to",
                                "page",
                                "totalPages",
                                "perPage",
                                "nextPage",
                                "previousPage"
                            ]
                        }
                    },
                    Users: {
                        delete: true,
                        one: {
                            id: true,
                            email: true,
                            enabled: true,
                            firstName: true,
                            lastName: true,
                            fullName: true,
                            avatar: ["id", "src", "size", "type", "name"],
                            groups: ["id", "name"],
                            policies: ["id", "name"]
                        },
                        create: {
                            id: true,
                            email: true,
                            enabled: true,
                            firstName: true,
                            lastName: true,
                            fullName: true,
                            avatar: ["id", "src", "size", "type", "name"],
                            groups: ["id", "name"],
                            policies: ["id", "name"]
                        },
                        update: {
                            id: true,
                            email: true,
                            enabled: true,
                            firstName: true,
                            lastName: true,
                            fullName: true,
                            avatar: ["id", "src", "size", "type", "name"],
                            groups: ["id", "name"],
                            policies: ["id", "name"]
                        },
                        list: {
                            data: {
                                id: true,
                                enabled: true,
                                name: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                fullName: true,
                                createdOn: true,
                                avatar: ["id", "src", "size", "type", "name"]
                            },
                            meta: [
                                "count",
                                "totalCount",
                                "from",
                                "to",
                                "page",
                                "totalPages",
                                "perPage",
                                "nextPage",
                                "previousPage"
                            ]
                        }
                    },
                    Policies: {
                        one: [
                            "id",
                            "name",
                            "slug",
                            "description",
                            "permissions",
                            "createdOn",
                            "system"
                        ],
                        list: {
                            data: ["id", "name", "description", "createdOn", "system"],
                            meta: [
                                "count",
                                "totalCount",
                                "from",
                                "to",
                                "page",
                                "totalPages",
                                "perPage",
                                "nextPage",
                                "previousPage"
                            ]
                        },
                        create: ["id", "name", "slug", "description", "permissions", "system"],
                        delete: true,
                        update: ["id", "name", "slug", "description", "permissions", "system"]
                    },
                    ApiTokens: {
                        one: ["id", "name", "slug", "description", "token", "permissions"],
                        list: {
                            data: ["id", "name", "slug", "description", "createdOn"],
                            meta: [
                                "count",
                                "totalCount",
                                "from",
                                "to",
                                "page",
                                "totalPages",
                                "perPage",
                                "nextPage",
                                "previousPage"
                            ]
                        },
                        create: ["id", "name", "slug", "description", "token", "permissions"],
                        delete: true,
                        update: ["id", "name", "slug", "description", "token", "permissions"]
                    }
                }
            },
            entities: {
                SecurityUserAvatar: "*",
                SecurityUser: "*",
                SecurityGroup: "*",
                SecurityPolicy: "*",
                SecurityApiToken: "*",
                SecurityGroups2Entities: "*",
                SecurityPolicies2Entities: "*"
            }
        }
    });

    await entity.save();
};
