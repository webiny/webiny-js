import { Group } from "webiny-api";

export default async () => {
    const entity = new Group();
    entity.populate({
        name: "Security",
        description: "Manage low-level security and users.",
        slug: "security",
        permissions: {
            api: {
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
                    groups: { id: true, name: true, slug: true },
                    enabled: true,
                    savedOn: true,
                    gravatar: true,
                    lastName: true,
                    createdOn: true,
                    firstName: true,
                    updatedOn: true
                },
                getSecurityGroup: {
                    id: true,
                    name: true,
                    slug: true,
                    savedOn: true,
                    createdOn: true,
                    updatedOn: true,
                    description: true,
                    permissions: true
                },
                listSecurityUsers: {
                    list: {
                        id: true,
                        email: true,
                        enabled: true,
                        savedOn: true,
                        gravatar: true,
                        lastName: true,
                        password: true,
                        createdOn: true,
                        firstName: true,
                        updatedOn: true
                    },
                    meta: { count: true, totalCount: true, totalPages: true }
                },
                createSecurityUser: {
                    id: true,
                    email: true,
                    groups: { id: true, name: true, slug: true },
                    enabled: true,
                    savedOn: true,
                    gravatar: true,
                    lastName: true,
                    createdOn: true,
                    firstName: true,
                    updatedOn: true
                },
                deleteSecurityUser: true,
                listSecurityGroups: {
                    list: {
                        id: true,
                        name: true,
                        slug: true,
                        savedOn: true,
                        createdOn: true,
                        updatedOn: true,
                        description: true,
                        permissions: true
                    },
                    meta: { count: true, totalCount: true, totalPages: true }
                },
                updateSecurityUser: {
                    id: true,
                    email: true,
                    groups: { id: true, name: true, slug: true },
                    enabled: true,
                    savedOn: true,
                    gravatar: true,
                    lastName: true,
                    createdOn: true,
                    firstName: true,
                    updatedOn: true
                },
                updateSecurityGroup: {
                    id: true,
                    name: true,
                    slug: true,
                    savedOn: true,
                    createdOn: true,
                    updatedOn: true,
                    description: true,
                    permissions: true
                },
                toggleEntityOperationPermission: {
                    entity: { name: true, classId: true, attributes: true },
                    permissions: { id: true, group: true, other: true, owner: true }
                }
            },
            entities: {
                SecurityUser: {
                    attributes: {
                        id: { read: true, write: true },
                        email: { read: true, write: true },
                        enabled: { read: true, write: true },
                        savedOn: { read: true },
                        gravatar: { read: true, write: true },
                        lastName: { read: true, write: true },
                        password: { read: true, write: true },
                        createdOn: { read: true },
                        firstName: { read: true, write: true },
                        updatedOn: { read: true }
                    },
                    operations: { read: true, create: true, delete: true, update: true }
                },
                SecurityGroup: {
                    attributes: {
                        id: { read: true, write: true },
                        name: { read: true, write: true },
                        slug: { read: true, write: true },
                        deleted: { read: true, write: true },
                        savedBy: { read: true, write: true },
                        savedOn: { read: true, write: true },
                        createdBy: { read: true, write: true },
                        createdOn: { read: true, write: true },
                        updatedBy: { read: true, write: true },
                        updatedOn: { read: true, write: true },
                        description: { read: true, write: true },
                        permissions: { read: true, write: true },
                        savedByClassId: { read: true, write: true },
                        createdByClassId: { read: true, write: true },
                        updatedByClassId: { read: true, write: true }
                    },
                    operations: { read: true, create: true, delete: true, update: true }
                },
                SecuritySettings: {
                    attributes: {
                        id: { read: true },
                        key: { read: true, write: true },
                        data: { read: true, write: true }
                    },
                    operations: { read: true, update: true }
                }
            }
        }
    });

    await entity.save();
};
