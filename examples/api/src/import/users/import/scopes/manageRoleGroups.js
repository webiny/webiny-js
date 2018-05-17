export default {
    getSecurityRoleGroup: {
        id: true,
        name: true,
        slug: true,
        roles: { id: true, name: true, slug: true },
        description: true
    },
    listSecurityRoleGroups: {
        list: { id: true, name: true, slug: true, createdOn: true, description: true },
        meta: { count: true, totalCount: true, totalPages: true }
    },
    createSecurityRoleGroup: {
        id: true,
        name: true,
        slug: true,
        roles: { id: true, name: true, slug: true },
        description: true
    },
    deleteSecurityRoleGroup: true,
    updateSecurityRoleGroup: {
        id: true,
        name: true,
        slug: true,
        roles: { id: true, name: true, slug: true },
        description: true
    }
};
