// @flow
import { Policy } from "./../../entities";

export default async () => {
    const entity = new Policy();
    entity.populate({
        name: "SecurityFullAccess",
        description: "Full access to low-level security settings and identities management.",
        slug: "security-full-access",
        permissions: {
            api: {
                Security: {
                    Policies: {
                        one: ["id", "name", "slug", "description", "permissions", "createdOn"],
                        list: {
                            data: ["id", "name", "description", "createdOn"],
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
                        create: ["id", "name", "slug", "description", "permissions"],
                        delete: true,
                        update: ["id", "name", "slug", "description", "permissions"]
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
