import { Policy } from "./../../";

export default async () => {
    const entity = new Policy();
    entity.populate({
        name: "SecurityFullAccess",
        description: "Full access to low-level security settings and identities management.",
        slug: "security-full-access",
        permissions: {
            api: {
                api: {
                    getFile: {},
                    listEntities: {
                        list: {
                            name: true,
                            classId: true,
                            attributes: { name: true, protected: true },
                            permissions: true
                        },
                        meta: { count: true, totalCount: true, totalPages: true }
                    },
                    getSecurityUser: {
                        id: true,
                        email: true,
                        groups: { id: true, name: true, slug: true, description: true },
                        enabled: true,
                        lastName: true,
                        policies: { id: true, name: true, slug: true, description: true },
                        firstName: true
                    },
                    getSecurityGroup: {
                        id: true,
                        name: true,
                        slug: true,
                        policies: { id: true, name: true },
                        description: true
                    },
                    getSecurityPolicy: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                        permissions: true
                    },
                    listSecurityUsers: {
                        list: {
                            id: true,
                            email: true,
                            enabled: true,
                            gravatar: true,
                            lastName: true,
                            createdOn: true,
                            firstName: true
                        },
                        meta: { count: true, totalCount: true, totalPages: true }
                    },
                    createSecurityUser: {
                        id: true,
                        email: true,
                        groups: { id: true, name: true },
                        enabled: true,
                        lastName: true,
                        policies: { id: true, name: true },
                        firstName: true
                    },
                    deleteSecurityUser: true,
                    listSecurityGroups: {
                        list: {
                            id: true,
                            name: true,
                            slug: true,
                            createdOn: true,
                            description: true
                        },
                        meta: { count: true, totalCount: true, totalPages: true }
                    },
                    updateSecurityUser: {
                        id: true,
                        email: true,
                        groups: { id: true, name: true },
                        enabled: true,
                        gravatar: true,
                        lastName: true,
                        policies: { id: true, name: true },
                        createdOn: true,
                        firstName: true
                    },
                    createSecurityGroup: {
                        id: true,
                        name: true,
                        slug: true,
                        policies: { id: true, name: true },
                        description: true
                    },
                    deleteSecurityGroup: true,
                    updateSecurityGroup: {
                        id: true,
                        name: true,
                        slug: true,
                        policies: { id: true, name: true },
                        description: true
                    },
                    createSecurityPolicy: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                        permissions: true
                    },
                    deleteSecurityPolicy: true,
                    listSecurityPolicies: {
                        list: {
                            id: true,
                            name: true,
                            slug: true,
                            createdOn: true,
                            description: true
                        },
                        meta: { count: true, totalCount: true, totalPages: true }
                    },
                    updateSecurityPolicy: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                        permissions: true
                    }
                },
                entities: {
                    SecurityUser: {
                        other: {
                            operations: { read: true, create: true, delete: true, update: true }
                        }
                    },
                    SecurityGroup: {
                        other: {
                            operations: { read: true, create: true, delete: true, update: true }
                        }
                    },
                    SecurityPolicy: {
                        other: {
                            operations: { read: true, create: true, delete: true, update: true }
                        }
                    },
                    SecurityGroups2Entities: {
                        other: {
                            operations: { read: true, create: true, delete: true, update: true }
                        }
                    },
                    SecurityPolicies2Entities: {
                        other: {
                            operations: { read: true, create: true, delete: true, update: true }
                        }
                    }
                }
            }
        }
    });

    await entity.save();
};
